const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

const Coldstuff = require('./runtime');
const Coldbrew = Coldstuff.Coldbrew;

const pgp = require('pg-promise')();

const cn = {
    host: process.env.DB_HOST,
    port: 5432,
    database: 'battlecode',
    user: 'battlecode',
    password: process.env.DB_PASS
};

const db = pgp(cn);

const queue = `
WITH t as (
    SELECT s.id as id, s.red_team_id as red_id, s.blue_team_id as blue_id,
           r.code as red, b.code as blue
    FROM api_scrimmage as s
    INNER JOIN api_team r ON r.id=s.red_team_id
    INNER JOIN api_team b ON b.id=s.blue_team_id
    WHERE s.status = 'queued' ORDER BY id LIMIT 1
)
UPDATE api_scrimmage SET status = 'running'
FROM t WHERE api_scrimmage.id = (
    SELECT id FROM api_scrimmage WHERE status = 'queued'
    ORDER BY id LIMIT 1
) RETURNING t.id as id, t.red_id as red_id, t.blue_id as blue_id, t.red as red, t.blue as blue;
`

const publish_replay = `
INSERT INTO api_replay (id, content) VALUES (DEFAULT, $1) RETURNING id;
`

const end_match = `
UPDATE api_scrimmage SET status = $1, replay_id = $2 WHERE id = $3;
`

const update_stats = `
UPDATE api_team SET $1~ = $1~ + 1 WHERE id = $2;
`

function playGame() {
    db.one(queue).then(function(scrimmage) {
        console.log(`[Worker ${process.pid}] Running match ${scrimmage.id}`);
        var seed = Math.floor(10000*Math.random());
        let c = new Coldbrew(null, seed, function(replay) {
            var r = JSON.stringify(replay);
            db.one(publish_replay,[r]).then(function(replay_id) {
                console.log(`[Worker ${process.pid}] Match ${scrimmage.id} complete.`);
                db.none(update_stats,[
                    replay.winner===0?'wins':'losses',
                    scrimmage.red_id
                ]);
                db.none(update_stats,[
                    replay.winner===0?'losses':'wins',
                    scrimmage.blue_id
                ]);
                db.none(end_match,[
                    replay.winner===0?'redwon':'bluewon',
                    replay_id.id,
                    scrimmage.id
                ]).then(playGame);
            });
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
}

setTimeout(playGame,Math.floor(5000*Math.random()));