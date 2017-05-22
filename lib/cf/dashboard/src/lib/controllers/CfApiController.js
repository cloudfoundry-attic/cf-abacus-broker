'use strict';

const logger = require('../dashboardLogger');
const HttpClient = require('../utils/HttpClient');
const helper = require('../utils/HttpClientHelper');
const config = require('../config');
const Promise = require('bluebird');
const errors = require('../errors');
const _ = require('lodash');


class CfApiController {
  constructor() {
    this.httpClient = new HttpClient();
    this._domain = '';
  }

  getSharedDomainsCall(request) {
    logger.debug('CfApiController::Fetching sharedDomains');
    let sharedDomainsUrl = `${config.cf.cf_api_endpoint}/v2/shared_domains`;
    if (_.isEmpty(config.cf.abacus_provisioning_endpoint)) 
      return this.httpClient.request(helper.generateRequestObject(
        'GET', sharedDomainsUrl, request.session.uaa_response.access_token))
        .then((res) => {
          let domains = res.body;
          if (domains.resources.length > 0) {
            let domainName = domains.resources[0].entity.name;
            let provisioningPlugin = config.cf.abacus_provisioning_plugin;
            config.cf.abacus_provisioning_endpoint = `https://${provisioningPlugin}.${domainName}`;
          }
        })
        .catch((error) => {
          Promise.reject(new Error('Failed to get shared domains ' + error.statusCode));
        });
    return Promise.resolve();
  }

  getServiceBinding(request) {
    logger.debug('CfApiController:: Fetching service binding');
    let bindingsUrl = `${config.cf.cf_api_endpoint}/v2/service_instances/${request.params.instance_id}/service_bindings`;
    let serviceBindingsPromise = this.httpClient.request(
      helper.generateRequestObject('GET', bindingsUrl, 
      request.session.uaa_response.access_token));
    let sharedDomainsPromise = this.getSharedDomainsCall(request);
    return Promise.join(serviceBindingsPromise, sharedDomainsPromise, 
      (serviceBindings, sharedDomains) => {
        let bindings = serviceBindings.body;
        if (bindings.resources.length > 0) {
          let bindingObj = bindings.resources[0];
          let metadata = bindingObj.metadata;
          let guid = metadata.guid;
          let creds = bindingObj.entity.credentials;
          request.sessionStore.creds = creds;
          request.sessionStore.guid = guid;
          let authResponse = this.httpClient.request({
            url: config.cf.token_url,
            rejectUnauthorized: false,
            method: 'POST',
            json: true,
            form: {
              'client_id': creds.client_id,
              'client_secret': creds.client_secret,
              'grant_type': 'client_credentials'
            }
          });
          return authResponse.then((authResponse) => {
            request.session.abacus_token = authResponse.body.access_token;
          });
        } 
        throw new errors.NotFound('Unable to find resource provider');
      });
  };
}

module.exports = CfApiController;