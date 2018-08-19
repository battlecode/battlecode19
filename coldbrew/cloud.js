const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

const Coldstuff = require('./runtime');
const Coldbrew = Coldstuff.Coldbrew;

const pgp = require('pg-promise')();

const cn = {
    host: 'localhost',
    port: 5432,
    database: 'battlecode',
    user: 'postgres',
    password: 'mysecretpassword'
};

const db = pgp(cn);

const get_queued = `
SELECT s.id as id, r.code as red, b.code as blue
FROM api_scrimmage as s
INNER JOIN api_team r ON r.id=s.red_team_id
INNER JOIN api_team b ON b.id=s.blue_team_id
WHERE s.status = 'queued'
LIMIT  1
`

const update_running = `
UPDATE api_scrimmage SET status = 'running' WHERE id=$1;
`

const publish_replay = `
INSERT INTO api_replay (id, content) VALUES (DEFAULT, $1) RETURNING id;
`

const end_match = `
UPDATE api_scrimmage SET status = $1, replay_id = $2 WHERE id = $3;
`

function playGame() {
    db.one(get_queued).then(function(scrimmage) {
        db.none(update_running,[scrimmage.id]).then(function() {
            console.log(`[Worker ${process.pid}] Running match ${scrimmage.id}`);
            var seed = Math.floor(10000*Math.random());
            let c = new Coldbrew(null, seed, function(replay) {
                var r = JSON.stringify(replay);
                db.one(publish_replay,[r]).then(function(replay_id) {
                    console.log(`[Worker ${process.pid}] Match ${scrimmage.id} complete.`);
                    db.none(end_match,[replay.winner===0?'redwon':'bluewon',replay_id.id,scrimmage.id]).then(playGame);
                });
            });

            c.playGame(scrimmage.red, scrimmage.blue);
        });
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