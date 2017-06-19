'use strict';
/* eslint-disable max-len*/
const logger = require('../utils/dashboardLogger');
const HttpClient = require('../utils/HttpClient');
const helper = require('../utils/HttpClientHelper');
const config = require('../utils/config');
const Promise = require('bluebird');
const errors = require('../utils/errors');
const _ = require('lodash');


class CfApiController {
  constructor() {
    this.httpClient = new HttpClient();
    this._domain = '';
  }

  getInfo() {
    logger.debug('CfApiController:: Fetching info details');
    let infoUrl = `${config.cf.cf_api_endpoint}/v2/info`;
    return this.httpClient.request(helper.generateRequestObject(
      'GET', infoUrl, '', {}, false));
  }

  getUserPermissions(request) {
    logger.debug('CfApiController:: Fetching user permisions');
    let guid = request.params.instance_id;
    let permissionEndpoint = `v2/service_instances/${guid}/permissions`;
    let permissionUrl = `${config.cf.cf_api_endpoint}/${permissionEndpoint}`;
    return this.httpClient.request(helper.generateRequestObject(
      'GET',permissionUrl,request.session.uaa_response.access_token
    ));
  }

  checkUserPermissionAndProceed(request) {
    return Promise.try(() => {
      return this.getUserPermissions(request).then((res)=>{
        if(res.body.manage)
          return this.getServiceBinding(request);
        logger.debug('Missing dashboard permissions');
        return Promise.reject(new errors.Forbidden('Missing permissions'));
      }).catch((error) => {
        logger.error(error);
        return Promise.reject(error);
      });
    });
  }

  getSharedDomainsCall(request) {
    let sharedDomainsUrl = `${config.cf.cf_api_endpoint}/v2/shared_domains`;
    if (_.isEmpty(config.cf.abacus_provisioning_endpoint)) {
      logger.debug('CfApiController::Fetching sharedDomains');
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
          logger.error('Failed to get shared domains',error);
          return Promise.reject(new errors.InternalServerError('Internal error'));
        });
    }  
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
          }).catch((error)=>{
            logger.error('Failed to get abacus token',error);
            return Promise.reject(new errors.InternalServerError('Internal Error'));
          });
        }
        logger.error('Unable to find service bindings');
        return Promise.reject(new errors.NotFound('Unable to find resource provider')); 
      });
  };
}

module.exports = CfApiController;
