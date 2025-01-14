const express = require("express");
const {
  getAllRegistrants,
  getRegistrantById,
  attachRegistrantById,
  checkInRegistrantById,
  patchRegistrantById,
  deleteRegistrantById,
} = require("../controllers/registrantController");

const router = express.Router({ mergeParams: true });

router.get("/", getAllRegistrants);

router.get("/:user_id", getRegistrantById);
router.post("/", attachRegistrantById);
router.patch("/checkin/:user_id", checkInRegistrantById);
router.patch("/:user_id", patchRegistrantById);
router.delete("/:user_id", deleteRegistrantById);

module.exports = router;
