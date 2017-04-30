"use strict";

const cluster = require('cluster');
const assert = require('assert');

assert(cluster.isWorker);

const subjectCallbacks = {};

process.on('message', message => {
    if (!isClusterTalkMessage(message)) {
        return;
    }

    const callback = subjectCallbacks[message.subject];

    if (typeof callback === 'undefined') {
        return;
    }

    callback(message.data, data => {
        process.send({
            __clusterTalkId: message.__clusterTalkId,
            data: data
        });
    });
});

function isClusterTalkMessage(message) {
    return typeof message === 'object' && typeof message.__clusterTalkId !== 'undefined';
};

module.exports = {
    on: function (subject, callback) {
        subjectCallbacks[subject] = callback;
    },
    off: function (subject) {
        delete subjectCallbacks[subject];
    }
};