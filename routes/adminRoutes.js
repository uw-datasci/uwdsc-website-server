const express = require("express");
const {
  getAllUsers,
  getUserById,
  createUser,
  patchUserById,
  deleteUserById,
  checkInById,
} = require("../controllers/adminController");

const {
  getAllEvents,
  getEventById,
  createEvent,
  patchEventById,
  deleteEventById,
} = require("../controllers/eventController");

const {
  createSubEvent
} = require("../controllers/subEventController");

const { requiresAll } = require("../middleware/errorHandler");
const { validateAdmin } = require("../middleware/validateTokenHandler");

const router = express.Router();

router.use(validateAdmin);

router.get("/users", getAllUsers);

router.get("/users/:id", getUserById);

router.post("/users", createUser);

router.patch("/users/:id", patchUserById);

router.patch("/users/checkIn/:id", requiresAll(["eventName"]), checkInById);

router.delete("/users/:id", deleteUserById);

router.use("/events/:event_id/registrants", require("./registrantRoutes"));

router.get("/events", getAllEvents);

router.get("/events/:id", getEventById);

router.post("/events", createEvent);

router.patch("/events/:id", patchEventById);

router.delete("/events/:id", deleteEventById);

router.post("/events/:event_id/subevents", createSubEvent);

module.exports = router;
