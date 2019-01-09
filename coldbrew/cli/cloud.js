#!/usr/bin/env node

const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

const SPECS = require('../specs');
const Game = require('../game');
const Coldbrew = require('../runtime');

const Storage = require('@google-cloud/storage');
const projectId = 'battlecode18';

const storage = new Storage({
    projectId: projectId
});

const bucket = storage.bucket('battlehack');

const pgp = require('pg-promise')();

const cn = {
    host: process.env.DB_HOST,
    port: 5432,
    database: 'battlecode',
    user: 'battlecode',
    password: process.env.DB_PASS
};

const db = pgp(cn);

const CHESS_INITIAL = SPECS.CHESS_INITIAL;
const CHESS_EXTRA = SPECS.CHESS_EXTRA;

const TABLE = 'api_scrimmage'

const queue = `
WITH t as (
    SELECT s.id as id, s.red_team_id as red_id, s.blue_team_id as blue_id,
           r.code as red, b.code as blue
    FROM ` + TABLE + ` as s
    INNER JOIN api_team r ON r.id=s.red_team_id
    INNER JOIN api_team b ON b.id=s.blue_team_id
    WHERE s.status = 'queued' ORDER BY id LIMIT 1
)
UPDATE ` + TABLE + ` SET status = 'running'
FROM t WHERE ` + TABLE + `.id = (
    SELECT id FROM ` + TABLE + ` WHERE status = 'queued'
    ORDER BY id LIMIT 1
) RETURNING t.id as id, t.red_id as red_id, t.blue_id as blue_id, t.red as red, t.blue as blue;
`

const end_match = `
UPDATE ` + TABLE + ` SET status = $1, replay = $2 WHERE id = $3;
`


function playGame() {
    db.one(queue).then(function(scrimmage) {
        console.log(`[Worker ${process.pid}] Running match ${scrimmage.id}`);
        var seed = Math.floor(Math.pow(2,31)*Math.random());
        
        let g = new Game(seed, CHESS_INITIAL, CHESS_EXTRA, false, true);

        let c = new Coldbrew(g, null, function(logs) {
            var replay_name = Math.random().toString(36).substring(2) + ".bc19";
            var file = bucket.file('replays/' + replay_name);
            var stream = file.createWriteStream({});

            stream.on('finish', ()=> {
                var url = 'https://battlecode.org/replays/' + replay_name;
                console.log(`[Worker ${process.pid}] Match ${scrimmage.id} complete.`);
                db.none(end_match,[
                    g.winner===0?'redwon':'bluewon',
                    url, scrimmage.id
                ]).then(playGame);
                c.destroy();
            });

            stream.end(Buffer.from(g.replay));
        });

        c.playGame(scrimmage.red, scrimmage.blue);
    }).catch(function(error) {
        setTimeout(playGame,Math.floor(5000*Math.random()));
    });
}


if (cluster.isMaster) {
    console.log(`Master ${process.pid} started, creating ${numCPUs} workers`);

    for (let i = 0; i < numCPUs; i++) cluster.fork();
    cluster.on('exit', (worker, code, signal) => {
        console.log(`[Worker ${worker.process.pid}] Worker died`);
    });
} else setTimeout(playGame,Math.floor(5000*Math.random()));
