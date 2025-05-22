const express = require("express");
const {
  getAllEvents,
  getEventById,
  createEvent,
} = require("../controllers/eventController");
const router = express.Router();

router.get("/", getAllEvents);
router.get("/:event_id", getEventById);
router.post("/", createEvent);

module.exports = router;
