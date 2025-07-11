const express = require("express");
const {
  getApplicationByUserId,
  getCurrentTerm,
  patchApplication,
} = require("../controllers/applicationController");
const { validateUser } = require("../middleware/validateTokenHandler");

const router = express.Router();

router.post("/save", validateUser, patchApplication);
router.post("/myApplication", validateUser, getApplicationByUserId);
router.get("/currentTerm", getCurrentTerm);

module.exports = router;
