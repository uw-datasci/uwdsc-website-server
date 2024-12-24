const express = require("express");
const { validateAdmin } = require("../middleware/validateTokenHandler");
const {
  getAllRegistrants,
  getRegistrantById,
  attachRegistrantById,
  patchRegistrantById,
  deleteRegistrantById,
} = require("../controllers/registrantController");

const router = express.Router({ mergeParams: true });

router.use(validateAdmin);

router.get("/", getAllRegistrants);

router.get("/:user_id", getRegistrantById);
router.post("/:user_id", attachRegistrantById);
router.patch("/:user_id", patchRegistrantById);
router.delete("/:user_id", deleteRegistrantById);

module.exports = router;
