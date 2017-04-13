const express = require('express');
const bodyParser = require('body-parser');
const request = require('abacus-request');
const oauth = require('abacus-oauth');
const app = express();

app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

const servicesEnv = JSON.parse(process.env.VCAP_SERVICES);
const applicationEnv = JSON.parse(process.env.VCAP_APPLICATION);

const credentials = servicesEnv.metering[0].credentials;
const clientId = credentials.client_id;
const clientSecret = credentials.client_secret;
const collectorUrl = credentials.collector_url;
const resourceId = clientId.match(/abacus-rp-(.*)/)[1];

const usageToken = oauth.cache(applicationEnv.cf_api, clientId, clientSecret,
  `abacus.usage.${resourceId}.write,abacus.usage.${resourceId}.read`);

usageToken.start();

app.get('/', (req, res) => {
  res.status(200).send(process.env.VCAP_SERVICES);
});

app.post('/usage', (req, res) => {
  const usage = req.body;
  request.post(`${collectorUrl}/v1/metering/collected/usage`, {
    headers:{
      'Content-Type': 'application/json',
      'Authorization': usageToken()
    },
    body: usage
  }, (err, val) => {
    console.log('err', err, 'val', val);
    if (err)
      res.status(500).send(err);
    else
      res.status(val.statusCode).send();
  });
});

app.listen(PORT, function() {
  console.log('Server running on http://localhost:' + PORT);
});
