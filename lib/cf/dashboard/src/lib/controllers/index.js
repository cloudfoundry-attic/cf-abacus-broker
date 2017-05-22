'use strict';

const CfAbacusController = require('./CfAbacusController');
const CfApiController = require('./CfApiController');

exports.CfAbacusController = CfAbacusController;
exports.CfApiController = CfApiController;

exports.cfAbacusApi = new CfAbacusController();
exports.cfApi = new CfApiController();
