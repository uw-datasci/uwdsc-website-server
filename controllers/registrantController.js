const asyncHandler = require("express-async-handler");

//@desc Get all registrants
//@route GET /api/admin/events/{{event_id}}/registrants
//@access Private
const getAllRegistrants = asyncHandler((req, res) => {
  return res.status(200).json({ message: "GET all registrants" });
});

//@desc Get registrant by ID
//@route GET /api/admin/events/{{event_id}}/registrants/{{user_id}}
//@access Private
const getRegistrantById = asyncHandler((req, res) => {
  return res.status(200).json({ message: "GET registrant by ID" });
});

//@desc Add registrant by ID
//@route POST /api/admin/events/{{event_id}}/registrants/{{user_id}}
//@access Private
const attachRegistrantById = asyncHandler((req, res) => {
  return res.status(200).json({ message: "POST registrant by ID" });
});

//@desc Update registrant by ID
//@route PATCH /api/admin/events/{{event_id}}/registrants/{{user_id}}
//@access Private
const patchRegistrantById = asyncHandler((req, res) => {
  return res.status(200).json({ message: "PATCH registrant by ID" });
});

//@desc Delete registrant by ID
//@route DELETE /api/admin/events/{{event_id}}/registrants/{{user_id}}
//@access Private
const deleteRegistrantById = asyncHandler((req, res) => {
  return res.status(200).json({ message: "DELETE registrant by ID" });
});

module.exports = {
  getAllRegistrants,
  getRegistrantById,
  attachRegistrantById,
  patchRegistrantById,
  deleteRegistrantById,
};
