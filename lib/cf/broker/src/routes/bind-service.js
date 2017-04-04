'use strict';

const uaa = require('../auth/uaa.js');

const createUaaClient = (instanceId, cb) => {
  uaa.createClient(instanceId, cb);
};

const bind = (req, res) => {
  createUaaClient(req.params.instance_id, (statusCode, credentials) => {
    res.status(statusCode).send(credentials);
  });
};

module.exports = bind;
module.exports.createUaaClient = createUaaClient;
