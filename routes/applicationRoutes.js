const express = require("express");
const {
  createApplication,
  getApplicationByUserId,
  getCurrentTerm,
  patchApplication,
} = require("../controllers/applicationController");
const { requiresAll } = require("../middleware/errorHandler");
const { validateUser } = require("../middleware/validateTokenHandler");

const router = express.Router();

router.post(
  "/submit",
  validateUser,
  requiresAll(["termApplyingFor", "personalInfo", "academicInfo", "resumeUrl"]),
  createApplication
);
router.post("/save", validateUser, patchApplication);
router.post("/my_application", validateUser, getApplicationByUserId);
router.get("/currentTerm", getCurrentTerm);

module.exports = router;
