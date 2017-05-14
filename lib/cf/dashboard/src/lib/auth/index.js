'use strict';

const authController = require('./AuthenticationController');

exports.authConfigCtrl = new authController();
exports.strategy = require('./authentication');