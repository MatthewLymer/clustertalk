"use strict";

const cluster = require('cluster');
const assert = require('assert');
const nonce = require('nonce')();

assert(cluster.isMaster);

const messageCallbacks = {};
const messageTimeouts = {};

function init(worker) {
    worker.on('message', message => {
        if (!isClusterTalkMessage(message)) {
            return;
        }

        const id = message.__clusterTalkId;

        const callback = messageCallbacks[id];
        
        if (typeof callback === 'undefined') {
            return;
        }

        clearTimeout(messageTimeouts[id]);

        delete messageTimeouts[id];
        delete messageCallbacks[id];

        callback(message.data);
    });
};

function send(worker, subject, data, timeout, callback) {
    if (typeof callback !== 'function') {
        throw new ClusterTalkException(`"Callback must be defined as a function.`);
    }

    const id = nonce();

    const message = {
        __clusterTalkId: id,
        subject,
        data
    };

    messageCallbacks[id] = callback;
    
    messageTimeouts[id] = setTimeout(function () {
        delete messageTimeouts[id];
        delete messageCallbacks[id];
    }, timeout);

    worker.send(message);
};

function isClusterTalkMessage(message) {
    return typeof message === 'object' && typeof message.__clusterTalkId !== 'undefined';
};

function ClusterTalkException(message) {
   this.message = message;
   this.name = 'ClusterTalkException';
};

module.exports = {
    send,
    init  
};