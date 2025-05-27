const express = require("express");
const {
  getAllEvents,
  getEventById,
  createEvent,
  getLatestEvent,
} = require("../controllers/eventController");
const router = express.Router();

router.get("/", getAllEvents);
router.get("/:event_id", getEventById);
router.get("/latest", getLatestEvent)
router.post("/", createEvent);

module.exports = router;
