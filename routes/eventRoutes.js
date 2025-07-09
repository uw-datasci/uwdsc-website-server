const express = require("express");
const {
  getAllEvents,
  getEventById,
  createEvent,
  getLatestEvent,
  getAllFutureEvents,
  patchEventById,
  deleteEventById,
} = require("../controllers/eventController");
const { checkInRegistrantById } = require("../controllers/registrantController");
const { validateUser } = require("../middleware/validateTokenHandler");
const router = express.Router();

router.get("/", getAllEvents);
router.get("/:event_id", getEventById);
router.post("/latest", getLatestEvent)
router.post("/future", getAllFutureEvents);
router.get("/:event_id", getEventById)
router.patch("/:event_id/registrants/checkin/:user_id", validateUser, checkInRegistrantById)

module.exports = router;
