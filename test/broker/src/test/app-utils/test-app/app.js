const express = require('express');
const bodyParser = require('body-parser');
const request = require('request-promise-native').defaults({ resolveWithFullResponse: true });
const oauth = require('abacus-oauth');
const app = express();
require('request-debug')(request);

const port = process.env.PORT || 3000;

const servicesEnv = JSON.parse(process.env.VCAP_SERVICES);
const applicationEnv = JSON.parse(process.env.VCAP_APPLICATION);

const credentials = servicesEnv[Object.keys(servicesEnv)[0]][0].credentials;

const clientId = credentials.client_id;
const clientSecret = credentials.client_secret;
const collectorURL = credentials.collector_url;
const reportingURL = collectorURL.replace('collector', 'reporting').replace('collected/usage', 'organizations');
const resourceId = credentials.resource_id;

const usageToken = oauth.cache(
  applicationEnv.cf_api,
  clientId,
  clientSecret,
  `abacus.usage.${resourceId}.write,abacus.usage.${resourceId}.read`
);

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.status(200).send(servicesEnv);
});

app.get('/summary/:orgid', async(req, res) => {
  console.log(`Requesting summary report for ${req.params.orgid}`);
  try {
    const response = await request.get(`${reportingURL}/${req.params.orgid}/aggregated/usage`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': usageToken()
      }
    });
    res.status(response.statusCode).send(JSON.parse(response.body));
  } catch (e) {
    console.log(`Error getting report: ${e}`);
    res.status(500).send(e);
  }
});

app.post('/usage', async(req, res) => {
  const usage = req.body;
  console.log(`Posting usage ${JSON.stringify(usage)} to collector ${collectorURL}`);
  try {
    const response = await request.post({
      uri: collectorURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': usageToken()
      },
      body: usage
    });
    res.status(response.statusCode).send(response.message);
  } catch (e) {
    console.log(`Error posting usage: ${e}`);
    res.status(500).send(e);
  }
});

usageToken.start(() => {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
});
