const express = require("express");
const { createApplication } = require("../controllers/applicationController");
const { requiresAll } = require("../middleware/errorHandler");
const { validateUser } = require("../middleware/validateTokenHandler");

const router = express.Router();

router.post(
  "/create",
  validateUser,
  requiresAll(["termApplyingFor", "personalInfo", "academicInfo", "resumeUrl"]),
  createApplication
);

module.exports = router;
