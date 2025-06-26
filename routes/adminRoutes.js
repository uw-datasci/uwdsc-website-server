const express = require("express");
const {
  getAllUsers,
  getUserById,
  createUser,
  patchUserById,
  deleteUserById,
  checkInById,
  getAllApplications, 
  getAllApplicationsByTerm,
  getApplicationById, 
  updateApplicationById, 
  deleteApplicationById,
  getAllTerms,
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
const { validateAdmin, validateExecRestrictions } = require("../middleware/validateTokenHandler");

const router = express.Router();

router.use(validateAdmin);
router.use(validateExecRestrictions);

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

router.get("/applications", getAllApplications);

router.get("/applications/byTerm/:termId", getAllApplicationsByTerm);

router.get("/applications/:id", getApplicationById);

router.patch("/applications/:id", updateApplicationById);

router.delete("/applications/:id", deleteApplicationById);

router.get("/terms", getAllTerms);

module.exports = router;
