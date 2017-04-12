'use strict';

const uaa = require('../auth/uaa.js');

const bind = (req, res) => {
  uaa.createClient(req.params.instance_id, (statusCode, result) => {
    if (result.credentials) {
      result.credentials.resource_id = req.params.instance_id;
      result.credentials.plans = [req.params.instance_id];
    }

    res.status(statusCode).send(result);
  });
};

module.exports = bind;
