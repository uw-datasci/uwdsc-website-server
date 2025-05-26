const express = require("express");
const { getAllEvents, getEventById, getLatestEvent } = require("../controllers/eventController");
const router = express.Router();

router.get("/", getAllEvents)
router.get("/latest", getLatestEvent)
router.get("/:event_id", getEventById)

module.exports = router;