'use strict';

const uaa = require('../auth/uaa.js');

const deleteUaaClient = (instanceId, cb) => {
  uaa.deleteClient(instanceId, cb);
};

const unbind = (req, res) => {
  deleteUaaClient(req.params.instance_id, (statusCode) => {
    res.status(statusCode).send({});
  });
};

module.exports = unbind;
module.exports.deleteUaaClient = deleteUaaClient;
