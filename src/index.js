"use strict";

const cluster = require('cluster');

const type = cluster.isMaster ? 'master' : 'worker';

module.exports = require(`./index.${type}`);