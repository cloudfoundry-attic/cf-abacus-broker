'use strict';

const createSymbol = function(name) {
  /* jshint newcap:false */
  return Symbol(name);
};

const status = require('./constants').STATUS;
const _ = require('lodash');


const getErrorMessage = (code) => {
  if(_.isEmpty(status[code]))
    return status[500];
  return status[code];
};

exports.getErrorMessage = getErrorMessage;

const descriptionSymbol = createSymbol('description');

class BaseError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  get description() {
    return this[descriptionSymbol] || this.message;
  }

  set description(description) {
    this[descriptionSymbol] = description;
  }
}
exports.BaseError = BaseError;

class ContinueWithNext extends BaseError {
  constructor() {
    super('Continue with next handler');
    this.code = 'ECONTINUE';
  }
}
exports.ContinueWithNext = ContinueWithNext;

class HttpError extends BaseError {
  constructor(status, reason, message) {
    super(message);
    this.status = status;
    this.reason = reason;
  }
}
exports.HttpError = HttpError;

class HttpClientError extends HttpError {
  constructor(status, reason, message) {
    super(status, reason, message);
  }
}
exports.HttpClientError = HttpClientError;

class NotFound extends HttpClientError {
  constructor(message) {
    super(404, 'Not Found', message);
  }
}
exports.NotFound = NotFound;

class BadRequest extends HttpClientError {
  constructor(message) {
    super(400, 'Bad Request', message);
  }
}
exports.BadRequest = BadRequest;

class Unauthorized extends HttpClientError {
  constructor(message) {
    super(401, 'Unauthorized', message);
  }
}
exports.Unauthorized = Unauthorized;

class Forbidden extends HttpClientError {
  constructor(message) {
    super(403, 'Forbidden', message);
  }
}
exports.Forbidden = Forbidden;

class HttpServerError extends HttpError {
  constructor(status, reason, message) {
    super(status, reason, message);
  }
}
exports.HttpServerError = HttpServerError;

class InternalServerError extends HttpServerError {
  constructor(message) {
    super(500, 'Internal Server Error', message);
  }
}
exports.InternalServerError = InternalServerError;

