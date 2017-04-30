"use strict";

const cluster = require('cluster');
const clusterTalk = require('../src/index');

function now() {
    var hrtime = process.hrtime();
    return ( hrtime[0] * 1000000 + hrtime[1] / 1000 ) / 1000;
}

if (cluster.isMaster) {
    let received = 0;

    const workers = [];

    let sendIndex = 0;

    for (var i = 0; i < 8; i++) {
        const worker = cluster.fork();
        clusterTalk.init(worker);
        workers.push(worker);
    }

    function sendMessage() {
        const worker = workers[sendIndex++ % workers.length];
        clusterTalk.send(worker, "greet", {now: now(), derp:{herp:[{zerp:{foo:"barzar"}}]}}, 500, resp => {
            received++;
        });
    }

    function doTest() {
        for (var i = 0; i < 200; i++) {
            setImmediate(sendMessage);
        }
    }

    var interval = setInterval(doTest, 25);

    setTimeout(function (){
        clearInterval(interval);

        console.log('total recieved: ' + received);
    }, 10000);
}
else {
    clusterTalk.on("greet", (data, callback) => {
        callback(data);
    });
}