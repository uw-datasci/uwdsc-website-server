const express = require("express");
const {
  getAllEvents,
  getEventById,
  createEvent,
  getLatestEvent,
} = require("../controllers/eventController");
const { checkInRegistrantById } = require("../controllers/registrantController");
const { validateUser } = require("../middleware/validateTokenHandler");
const router = express.Router();

router.get("/", getAllEvents);
router.get("/:event_id", getEventById);
router.post("/latest", getLatestEvent)
router.get("/:event_id", getEventById)
router.patch("/:event_id/registrants/checkin/:user_id", validateUser, checkInRegistrantById)
router.post("/create", createEvent);

module.exports = router;
