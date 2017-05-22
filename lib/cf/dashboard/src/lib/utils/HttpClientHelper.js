'use strict';

const generateRequestObject = (method, url, accessToken, body) => {
  return {
    method: method,
    url: url,
    rejectUnauthorized: false,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-cache',
      'Authorization': `bearer ${accessToken}`
    },
    body: body || null,
    json: true
  };
};

exports.generateRequestObject = generateRequestObject;
