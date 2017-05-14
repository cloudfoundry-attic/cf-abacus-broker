'use strict';

const logger = require('../logger');
const HttpClient = require('../utils/HttpClient');
const helper = require('../utils/HttpClientHelper');
const config = require('../config');
const promise = require('bluebird');
let credentials = {};

class CfAbacusController {
    constructor() {
        this.httpClient = new HttpClient();
    }

    getMeteringPlan(req) {
        logger.debug('CfAbacusController:: Fetching metering plan');
        let url = `${config.cf.abacus_provisioning_endpoint}/v1/metering/plans/${req.params.plan_id}`;
        return this.httpClient.request(helper.generateRequestObject('GET', url, req.session.abacus_token));
    }

    updateMeteringPlan(req) {
        logger.debug('CfAbacusController:: updating metering plan');
        let url = `${config.cf.abacus_provisioning_endpoint}/v1/metering/plan/${req.params.plan_id}`;
        return this.httpClient.request(helper.generateRequestObject('PUT', url, req.session.abacus_token, req.body));
    }
}

module.exports = CfAbacusController;