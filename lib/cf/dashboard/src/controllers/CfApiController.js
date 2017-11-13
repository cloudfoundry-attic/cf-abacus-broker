'use strict';
/* eslint-disable max-len*/
const logger = require('../utils/dashboardLogger');
const HttpClient = require('../utils/HttpClient');
const helper = require('../utils/HttpClientHelper');
const config = require('../config');
const Promise = require('bluebird');
const errors = require('../utils/errors');

class CfApiController {
  constructor() {
    this.httpClient = new HttpClient();
    this._domain = '';
  }

  getInfo() {
    logger.debug('CfApiController:: Fetching info details');
    let infoUrl = `${config.uris().api}/v2/info`;
    return this.httpClient.request(helper.generateRequestObject(
      'GET', infoUrl, '', {}, false));
  }

  getUserPermissions(request) {
    logger.debug('CfApiController:: Fetching user permisions');
    let guid = request.params.instance_id;
    let permissionEndpoint = `v2/service_instances/${guid}/permissions`;
    let permissionUrl = `${config.uris().api}/${permissionEndpoint}`;
    return this.httpClient.request(helper.generateRequestObject(
      'GET', permissionUrl, request.session.uaa_response.access_token
    ));
  }

  checkUserPermissionAndProceed(request) {
    return Promise.try(() => {
      return this.getUserPermissions(request).then((res) => {
        if (res.body.manage)
          return this.getServiceBinding(request);
        logger.debug('Missing dashboard permissions');
        return Promise.reject(new errors.Forbidden('Missing permissions'));
      }).catch((error) => {
        logger.error(error);
        return Promise.reject(error);
      });
    });
  }

  getAccessToken(creds) {
    return this.httpClient.request({
      url: config.cf.token_url,
      rejectUnauthorized: !process.env.SELF_SIGNED_CERT,
      method: 'POST',
      json: true,
      form: {
        'client_id': creds.client_id,
        'client_secret': creds.client_secret,
        'grant_type': 'client_credentials'
      }
    });
  }

  getServiceBinding(request) {
    logger.debug('CfApiController:: Fetching service binding');
    let bindingsUrl = `${config.uris().api}/v2/service_instances/${request.params.instance_id}/service_bindings`;
    return this.httpClient.request(
      helper.generateRequestObject('GET', bindingsUrl,
        request.session.uaa_response.access_token)).then((serviceBindings) => {
      let bindings = serviceBindings.body;
      if (bindings.resources.length > 0) {
        let bindingObj = bindings.resources[0];
        let metadata = bindingObj.metadata;
        let guid = metadata.guid;
        let creds = bindingObj.entity.credentials;
        request.session.creds = creds;
        request.session.guid = guid;
        let authResponse = this.getAccessToken(creds);
        return authResponse.then((authResponse) => {
          request.session.abacus_token = authResponse.body.access_token;
        }).catch((error) => {
          logger.error('Failed to get abacus token', error);
          return Promise.reject(new errors.InternalServerError('Internal Error'));
        });
      }
      logger.error('Unable to find service bindings');
      return Promise.reject(new errors.NotFound('Unable to find resource provider'));
    });
  };
}

module.exports = CfApiController;
