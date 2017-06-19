'use strict';
/* eslint-disable max-len*/
const logger = require('../utils/dashboardLogger');
const HttpClient = require('../utils/HttpClient');
const helper = require('../utils/HttpClientHelper');
const config = require('../utils/config');
const Promise = require('bluebird');
const _ = require('lodash');

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

  getRatingPlan(req) {
    logger.debug('CfAbacusController:: Fetching rating plan');
    let url = `${config.cf.abacus_provisioning_endpoint}/v1/rating/plans/${req.params.plan_id}`;
    return this.httpClient.request(helper.generateRequestObject('GET', url, req.session.abacus_token));
  }

  updateRatingPlan(req, plan) {
    logger.debug('CfAbacusController:: updating rating plan');
    let url = `${config.cf.abacus_provisioning_endpoint}/v1/rating/plan/${req.params.plan_id}`;
    return this.httpClient.request(helper.generateRequestObject('PUT', url, req.session.abacus_token,plan));
  }

  getPricingPlan(req) {
    logger.debug('CfAbacusController:: Fetching pricing plan');
    let url = `${config.cf.abacus_provisioning_endpoint}/v1/pricing/plans/${req.params.plan_id}`;
    return this.httpClient.request(helper.generateRequestObject('GET', url, req.session.abacus_token));
  }

  updatePricingPlan(req, plan) {
    logger.debug('CfAbacucController:: updating pricing plan');
    let url = `${config.cf.abacus_provisioning_endpoint}/v1/pricing/plan/${req.params.plan_id}`;
    return this.httpClient.request(helper.generateRequestObject('PUT', url, req.session.abacus_token, plan));
  }

  updateAllPlans(req) {
    // First update rating and pricing
    logger.debug('CfAbacusController:: updating all plans');
    let getRating = this.getRatingPlan(req);
    let getPricing = this.getPricingPlan(req);
    // metric_id as per convention
    let metric = req.params.metric_id;
    return Promise.join(getRating, getPricing, (getRatingResp, getPricingResp) => {
      let ratingPlan = getRatingResp.body;
      let pricingPlan = getPricingResp.body;
      ratingPlan = this.addRatingMetric(ratingPlan, metric);
      pricingPlan = this.addPricingMetric(pricingPlan, metric);
      let updateRating = this.updateRatingPlan(req, ratingPlan);
      let updatePricing = this.updatePricingPlan(req, pricingPlan);
      return Promise.join(updateRating, updatePricing, (updateRatingResp, updatePricingResp) => {
        return this.updateMeteringPlan(req);
      }).catch((error) => {
        logger.error(error);
        return Promise.reject(error);
      });
    }).catch((error)=> {
      logger.error(error);
      return Promise.reject(error);
    });
  }

  addRatingMetric(plan, metric) {
    let index = _.findIndex(plan.metrics, {
      name: metric
    });
    if (_.isEqual(index, -1)) {
      let metricObj = {};
      metricObj.name = metric;
      plan.metrics.push(metricObj);
    }
    return plan;
  }

  addPricingMetric(plan,metric) {
    let index = _.findIndex(plan.metrics, {
      name : metric
    });
    if(_.isEqual(index,-1)) {
      let metricObj = {};
      metricObj.name = metric;
      metricObj.prices = [{
        country : 'sampleCountry',
        price : 0
      }];
      plan.metrics.push(metricObj);
    }
    return plan;
  }

}

module.exports = CfAbacusController;
