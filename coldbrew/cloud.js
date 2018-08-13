var Coldbrew = require('./runtime');

const PubSub = require('@google-cloud/pubsub');
const pubsub = PubSub();

const Buffer = require('safe-buffer').Buffer;

exports.coldbrewRunner = (data, context, callback) => {
    const pubSubMessage = data;
    var message = JSON.parse(Buffer.from(pubSubMessage.data, 'base64').toString());

    console.log("Message: " + message)

    if (!('red' in message && 'blue' in message && typeof message.blue === 'string' && typeof message.red === 'string')) return;

    var seed = Math.floor(10000*Math.random());
    let c = new Coldbrew(null, seed, function(replay) {
        var r = JSON.stringify(replay);
        callback(null,r);
    });

    c.playGame(message.red, message.blue);
};