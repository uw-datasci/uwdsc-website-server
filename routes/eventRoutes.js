const express = require("express");

const router = express.Router();

router.use("/:event_id/registrants", require("./registrantRoutes"));
module.exports = router;
