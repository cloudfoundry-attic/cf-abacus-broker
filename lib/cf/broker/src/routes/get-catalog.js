'use strict';

const catalog = require('../catalog/catalog.json');

module.exports = (req, res) => {
  res.send(catalog);
};

