const asyncHandler = require("express-async-handler");

//@desc Get all contacts
//@route GET /api/contacts
//@access private
const getHello = asyncHandler(async (req, res) => {
  res.status(200).json("Hello");
});

module.exports = {
  getHello
};