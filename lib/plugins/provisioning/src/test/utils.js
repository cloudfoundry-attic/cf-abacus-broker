'use strict';

const jwt = require('jsonwebtoken');

const tokenSecret = 'secret';
const systemWriteTokenPayload = {
  jti: '254abca5-1c25-40c5-99d7-2cc641791517',
  sub: 'abacus-provisioning-plugin',
  authorities: [
    'abacus.usage.write'
  ],
  scope: [
    'abacus.usage.write'
  ],
  client_id: 'abacus-provisioning-plugin',
  cid: 'abacus-provisioning-plugin',
  azp: 'abacus-provisioning-plugin',
  grant_type: 'client_credentials',
  rev_sig: '2cf89595',
  iat: 1456147679,
  exp: 1456190879,
  iss: 'https://localhost:1234/oauth/token',
  zid: 'uaa',
  aud: [
    'abacus-provisioning-plugin',
    'abacus.usage'
  ]
};

const systemReadTokenPayload = {
  jti: '254abca5-1c25-40c5-99d7-2cc641791517',
  sub: 'abacus-provisioning-plugin',
  authorities: [
    'abacus.usage.read'
  ],
  scope: [
    'abacus.usage.read'
  ],
  client_id: 'abacus-provisioning-plugin',
  cid: 'abacus-provisioning-plugin',
  azp: 'abacus-provisioning-plugin',
  grant_type: 'client_credentials',
  rev_sig: '2cf89595',
  iat: 1456147679,
  exp: 1456190879,
  iss: 'https://localhost:1234/oauth/token',
  zid: 'uaa',
  aud: [
    'abacus-provisioning-plugin',
    'abacus.usage'
  ]
};

const systemTokenPayload = {
  jti: '254abca5-1c25-40c5-99d7-2cc641791517',
  sub: 'abacus-provisioning-plugin',
  authorities: [
    'abacus.usage.read',
    'abacus.usage.write'
  ],
  scope: [
    'abacus.usage.read',
    'abacus.usage.write'
  ],
  client_id: 'abacus-provisioning-plugin',
  cid: 'abacus-provisioning-plugin',
  azp: 'abacus-provisioning-plugin',
  grant_type: 'client_credentials',
  rev_sig: '2cf89595',
  iat: 1456147679,
  exp: 1456190879,
  iss: 'https://localhost:1234/oauth/token',
  zid: 'uaa',
  aud: [
    'abacus-provisioning-plugin',
    'abacus.usage'
  ]
};

const dummyWriteTokenPayload = {
  jti: '254abca5-1c25-40c5-99d7-2cc641791517',
  sub: 'abacus-provisioning-plugin',
  authorities: [
    'abacus.usage.dummy.write'
  ],
  scope: [
    'abacus.usage.dummy.write'
  ],
  client_id: 'abacus-provisioning-plugin',
  cid: 'abacus-provisioning-plugin',
  azp: 'abacus-provisioning-plugin',
  grant_type: 'client_credentials',
  rev_sig: '2cf89595',
  iat: 1456147679,
  exp: 1456190879,
  iss: 'https://localhost:1234/oauth/token',
  zid: 'uaa',
  aud: [
    'abacus-provisioning-plugin',
    'abacus.usage'
  ]
};

const dummyReadTokenPayload = {
  jti: '254abca5-1c25-40c5-99d7-2cc641791517',
  sub: 'abacus-provisioning-plugin',
  authorities: [
    'abacus.usage.dummy.read'
  ],
  scope: [
    'abacus.usage.dummy.read'
  ],
  client_id: 'abacus-provisioning-plugin',
  cid: 'abacus-provisioning-plugin',
  azp: 'abacus-provisioning-plugin',
  grant_type: 'client_credentials',
  rev_sig: '2cf89595',
  iat: 1456147679,
  exp: 1456190879,
  iss: 'https://localhost:1234/oauth/token',
  zid: 'uaa',
  aud: [
    'abacus-provisioning-plugin',
    'abacus.usage'
  ]
};

const dummyTokenPayload = {
  jti: '254abca5-1c25-40c5-99d7-2cc641791517',
  sub: 'abacus-provisioning-plugin',
  authorities: [
    'abacus.usage.dummy.read',
    'abacus.usage.dummy.write'
  ],
  scope: [
    'abacus.usage.dummy.read',
    'abacus.usage.dummy.write'
  ],
  client_id: 'abacus-provisioning-plugin',
  cid: 'abacus-provisioning-plugin',
  azp: 'abacus-provisioning-plugin',
  grant_type: 'client_credentials',
  rev_sig: '2cf89595',
  iat: 1456147679,
  exp: 1456190879,
  iss: 'https://localhost:1234/oauth/token',
  zid: 'uaa',
  aud: [
    'abacus-provisioning-plugin',
    'abacus.usage'
  ]
};

const sign = (payload, secret) => {
  return jwt.sign(payload, secret, { expiresIn: 43200 });
};

const getBearerToken = (signedToken) => {
  return 'bearer ' + signedToken;
};

const authorization = (payload) => ({
  authorization: getBearerToken(sign(payload, tokenSecret))
});

const getSystemReadAuthorization = () => {
  return authorization(systemReadTokenPayload);
};

const getSystemWriteAuthorization = () => {
  return authorization(systemWriteTokenPayload);
};

const getSystemAuthorization = () => {
  return authorization(systemTokenPayload);
};

const getDummyReadAuthorization = () => {
  return authorization(dummyReadTokenPayload);
};

const getDummyWriteAuthorization = () => {
  return authorization(dummyWriteTokenPayload);
};

const getDummyAuthorization = () => {
  return authorization(dummyTokenPayload);
};

module.exports.TOKEN_SECRET = tokenSecret;
module.exports.getSystemReadAuthorization = getSystemReadAuthorization;
module.exports.getSystemWriteAuthorization = getSystemWriteAuthorization;
module.exports.getSystemAuthorization = getSystemAuthorization;
module.exports.getDummyReadAuthorization = getDummyReadAuthorization;
module.exports.getDummyWriteAuthorization = getDummyWriteAuthorization;
module.exports.getDummyAuthorization = getDummyAuthorization;
