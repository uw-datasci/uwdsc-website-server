const express = require("express");
const {
  createOrUpdateApplication,
  getCurrentTerm,
  getCurrentApplicationByUserId,
} = require("../controllers/applicationController");
const { validateUser } = require("../middleware/validateTokenHandler");

const router = express.Router();

router.post("/save", validateUser, createOrUpdateApplication);
router.post("/myApplication", validateUser, getCurrentApplicationByUserId);
router.get("/currentTerm", getCurrentTerm);

module.exports = router;
