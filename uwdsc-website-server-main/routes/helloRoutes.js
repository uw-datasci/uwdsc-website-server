const express = require("express");
const router = express.Router();
const {
  getHello,
} = require("../controllers/helloController");

router.route("/").get(getHello);

module.exports = router;