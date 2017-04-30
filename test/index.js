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
        const data = {
            now: now()
        };
        
        clusterTalk.send(worker, "greet", data, 30000).then((resp) => {
            received++;
        }).catch(err => {
            console.log(err);
        });
    }

    function doTest() {
        for (var i = 0; i < workers.length * 5; i++) {
            setImmediate(sendMessage);
        }
    }

    var interval = setInterval(doTest, 25);

    const testLengthInSeconds = 3;

    setTimeout(function (){
        clearInterval(interval);

        console.log('total recieved: ' + received);
        console.log('requests per second: ' + (received / testLengthInSeconds));
    
        process.exit();
    }, testLengthInSeconds * 1000);

    setTimeout(function (){
        while (workers.length > 0) {
            const worker = workers.pop();
            worker.kill();
            console.log('Killed worker: ' + worker.id);
        }

    }, (testLengthInSeconds - 1) * 1000);
}
else {
    clusterTalk.on("greet", (data, callback) => {
        callback(data);
    });
}