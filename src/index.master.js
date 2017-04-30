"use strict";

const cluster = require('cluster');
const assert = require('assert');
const nonce = require('nonce')();
const DoubleIndexedContainer = require('./double-indexed-container');

assert(cluster.isMaster);

const resolvers = new DoubleIndexedContainer();

function init(worker) {
    worker.on('message', message => {
        if (!isClusterTalkMessage(message)) {
            return;
        }

        const resolver = resolvers.get(message.__clusterTalkId);
        
        if (resolver == null) {
            return;
        }

        resolver.resolve(message.data);
    });

    worker.on('exit', function (){
        resolvers.getAll(worker.id).forEach(resolver => {
            resolver.reject(`Worker ${worker.id} exited prematurely.`);
        });

        resolvers.removeAll(worker.id);
    });
};

function send(worker, subject, data, timeoutInMilliseconds) {
    const id = nonce();

    return new Promise((resolve, reject) => {
        const message = {
            __clusterTalkId: id,
            subject,
            data
        };

        resolvers.add(id, worker.id, {
            resolve,
            reject
        });

        setTimeout(() => {
            reject("Timeout while waiting for response to message id: " + id);
        }, timeoutInMilliseconds)

        worker.send(message);
    }).then(data => {
        resolvers.remove(id);
        return data;
    }).catch(error => {
        resolvers.remove(id);
        throw error;
    });
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