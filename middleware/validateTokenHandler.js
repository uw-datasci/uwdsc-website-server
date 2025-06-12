const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv").config();

const validateUser = asyncHandler(async (req, res, next) => {
  let token;
  let authHeader = req.headers.Authorization || req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer")) {
    token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        res.status(401);
        throw new Error("User is not authorized");
      }
      req.user = decoded.user;
      console.log("User verified")
      next();
    });

    if (!token) {
      res.status(401);
      throw new Error("User is not authorized or token is missing");
    }
  } else {
    res.status(401);
    throw new Error("User is not authorized or token is missing");
  }
});


const validateAdmin = asyncHandler(async (req, res, next) => {
  let token;
  let authHeader = req.headers.Authorization || req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer")) {
    token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        res.status(401);
        throw new Error("User is not authorized");
      }
      req.user = decoded.user;
      
      // Check if user has admin or exec privileges
      if (req.user.userStatus !== 'admin' && req.user.userStatus !== 'exec') {
        res.status(403);
        throw new Error("Access denied, user is not an admin.");
      }
      
      console.log("Admin verified");
      next();
    });

    if (!token) {
      res.status(401);
      throw new Error("User is not authorized or token is missing");
    }
  } else {
    res.status(401);
    throw new Error("User is not authorized or token is missing");
  }
});


// Middleware to prevent exec users from certain admin operations
const validateExecRestrictions = asyncHandler(async (req, res, next) => {
  // Only apply restrictions if user is exec
  if (req.user && req.user.userStatus === 'exec') {
    const method = req.method;
    const path = req.path;
    
    // Block exec users from deleting users
    if (method === 'DELETE' && path.includes('/users/')) {
      res.status(403);
      throw new Error("Access denied. Exec users cannot delete other users.");
    }
    
    // Block exec users from changing userStatus in user updates
    if ((method === 'PATCH' || method === 'PUT') && path.includes('/users/') && req.body.userStatus) {
      res.status(403);
      throw new Error("Access denied. Exec users cannot change user status.");
    }
  }
  
  next();
});


module.exports = { validateUser, validateAdmin, validateExecRestrictions };