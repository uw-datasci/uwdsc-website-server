const { constants } = require("../constants");
const asyncHandler = require("express-async-handler");

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500;
  switch (statusCode) {
    case constants.BAD_REQUEST:
      res.json({
        title: "Bad Request",
        message: err.message,
        stackTrace: err.stack,
      });
      break;
    case constants.NOT_FOUND:
      res.json({
        title: "Not Found",
        message: err.message,
        stackTrace: err.stack,
      });
    case constants.UNAUTHORIZED:
      res.json({
        title: "Unauthorized",
        message: err.message,
        stackTrace: err.stack,
      });
    case constants.FORBIDDEN:
      res.json({
        title: "Forbidden",
        message: err.message,
        stackTrace: err.stack,
      });
    case constants.SERVER_ERROR:
      res.json({
        title: "Server Error",
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