const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', function(req, res) {
  res.send(200, process.env.VCAP_SERVICES);
});

app.listen(PORT, function() {
  console.log('Server running on http://localhost:' + PORT);
});
