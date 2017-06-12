const express = require('express');
const bodyParser = require('body-parser');
const request = require('abacus-request');
const oauth = require('abacus-oauth');
const app = express();
require('request-debug')(request);

app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

const servicesEnv = JSON.parse(process.env.VCAP_SERVICES);
const applicationEnv = JSON.parse(process.env.VCAP_APPLICATION);

const credentials = servicesEnv[Object.keys(servicesEnv)[0]][0].credentials;

const clientId = credentials.client_id;
const clientSecret = credentials.client_secret;
const collectorUrl = credentials.collector_url;
const resourceId = credentials.resource_id;

const usageToken = oauth.cache(applicationEnv.cf_api, clientId, clientSecret,
  `abacus.usage.${resourceId}.write,abacus.usage.${resourceId}.read`);

usageToken.start();

app.get('/', (req, res) => {
  res.status(200).send(process.env.VCAP_SERVICES);
});

app.post('/usage', (req, res) => {
  const usage = req.body;
  console.log('Posting usage %o to collector %s', usage, collectorUrl);
  request.post(collectorUrl, {
    headers:{
      'Content-Type': 'application/json',
      'Authorization': usageToken()
    },
    body: usage
  }, (err, response) => {
    if (err) {
      console.log('An error posting usage occured: %o', err);
      res.status(500).send(err);
      return;
    }
    console.log('Collector replied with %s and %s, %o',response.statusCode,
      response.message, response.body);
    res.status(response.statusCode).send(response.message);
  });
});

app.listen(PORT, function() {
  console.log('Server running on http://localhost:' + PORT);
});
