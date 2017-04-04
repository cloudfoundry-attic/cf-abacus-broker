'use strict';

const catalog = require('../catalog/catalog.js');

module.exports = (req, res) => {
  res.send(catalog);
};

