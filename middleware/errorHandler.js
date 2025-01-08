const { HTTP_CONSTANTS } = require("../constants");
const asyncHandler = require("express-async-handler");

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500;
  switch (statusCode) {
    case HTTP_CONSTANTS.BAD_REQUEST:
      res.json({
        title: "Bad Request",
        message: err.message,
        stackTrace: err.stack,
      });
      break;
    case HTTP_CONSTANTS.NOT_FOUND:
      res.json({
        title: "Not Found",
        message: err.message,
        stackTrace: err.stack,
      });
    case HTTP_CONSTANTS.UNAUTHORIZED:
      res.json({
        title: "Unauthorized",
        message: err.message,
        stackTrace: err.stack,
      });
    case HTTP_CONSTANTS.FORBIDDEN:
      res.json({
        title: "Forbidden",
        message: err.message,
        stackTrace: err.stack,
      });
    case HTTP_CONSTANTS.SERVER_ERROR:
      res.json({
        title: "Server Error",
        message: err.message,
        stackTrace: err.stack,
      });
    case HTTP_CONSTANTS.CONFLICT:
      res.json({
        title: "Conflict",
        message: err.message,
        stackTrace: err.stack,
      });
    default:
      console.log("Successfully handled request");
      break;
  }
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