const express = require("express");
const { getAllEvents, getEventById } = require("../controllers/eventController");
const router = express.Router();

router.get("/", getAllEvents)
router.get("/:event_id", getEventById)

module.exports = router;