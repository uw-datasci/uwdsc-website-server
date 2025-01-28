const { HTTP_CONSTANTS } = require("../constants");
const asyncHandler = require("express-async-handler");
const pino = require('pino');
const logger = pino();

const errorHandler = (err, req, res, next) => {
  if (!res.statusCode) {
    res.status(HTTP_CONSTANTS.SERVER_ERROR);
  }
  const error = {
    title: res.statusCode + " Error",
    message: err.message,
    stackTrace: err.stack,
  };

  switch (res.statusCode) {
    case HTTP_CONSTANTS.BAD_REQUEST:
      error.title = res.statusCode + " Bad Request";
      logger.info(error);
    case HTTP_CONSTANTS.NOT_FOUND:
      error.title = res.statusCode + " Not Found";
      logger.info(error);
    case HTTP_CONSTANTS.UNAUTHORIZED:
      error.title = res.statusCode + " Unauthorized";
      logger.info(error);
    case HTTP_CONSTANTS.FORBIDDEN:
      error.title = res.statusCode + " Forbidden";
      logger.info(error);
    case HTTP_CONSTANTS.SERVER_ERROR:
      error.title = res.statusCode + " Server Error";
      logger.info(error);
    case HTTP_CONSTANTS.CONFLICT:
      error.title = res.statusCode + " Conflict";
      logger.info(error);
    default:
      logger.error(error);
  }

  res.json(error);
};

const requiresAll = (paramArr) => {
  return asyncHandler(async (req, res, next) => {
    const hasAllParams = paramArr.every((param) => req.body.hasOwnProperty(param));
    
    if (!hasAllParams) {
      res.status(400)
      throw new Error("Missing required parameters");
    }

    next();
  })
}

const requiresOneOf = (paramArr) => {
  return asyncHandler(async (req, res, next) => {
    const hasAllParams = paramArr.some((param) => req.body.hasOwnProperty(param));
    
    if (!hasAllParams) {
      res.status(400)
      throw new Error("Missing required parameters");
    }

    next();
  })
}

module.exports = {errorHandler, requiresAll, requiresOneOf};