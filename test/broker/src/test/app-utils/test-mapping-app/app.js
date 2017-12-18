const bodyParser = require('body-parser');
const express = require('express');

const app = express();

const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const data = [];

const getStatus = (object, properties) => {

  for(let property of properties)
    if(!object.hasOwnProperty(property))
      return { statusCode: 500, message: `No ${property} found in body` };

  return { statusCode: 200 };
};

app.post('/v1/provisioning/mappings/services/resource/:resource/plan/:plan', (req, res) => {
  const resource = req.params.resource;
  const plan = req.params.plan;

  console.log(`Test mapping api POST : resource: ${resource} and plan: ${plan}`);

  const body = req.body;

  const expectedValues = ['organization_guid', 'space_guid', 'service_name',
    'service_plan_name'];

  const response = getStatus(body, expectedValues);

  const statusCode = response.statusCode;
  console.log('-----');
  console.log(statusCode);
  const message = response.message;

  if (statusCode === 200)
    data.push([{ resource, plan }, body]);

  res.status(statusCode).send(message ? { message } : undefined);
});

app.get('/v1/provisioning/mappings/services', (req, res) => {
  console.log('Test mapping api GET : current data: %j', data);
  res.status(200).send(data);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
