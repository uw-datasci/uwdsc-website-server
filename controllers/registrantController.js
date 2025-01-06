const asyncHandler = require("express-async-handler");
const Event = require("../models/eventModel");
const User = require("../models/userModel");

//@desc Get all registrants
//@route GET /api/admin/events/{{event_id}}/registrants
//@access Private
const getAllRegistrants = asyncHandler(async (req, res) => {
  const eventId = req.params.event_id;

  const event = await Event.findOne({ _id: eventId }).populate(
    "registrants.userId"
  );
  if (!event) {
    res.status(404);
    throw new Error("Event not found.");
  }

  const registrants = event.registrants;
  return res.status(200).json({ registrants });
});

//@desc Get registrant by ID
//@route GET /api/admin/events/{{event_id}}/registrants/{{user_id}}
//@access Private
const getRegistrantById = asyncHandler(async (req, res) => {
  const eventId = req.params.event_id;
  const userId = req.params.user_id;

  const event = await Event.findOne({ _id: eventId }).populate(
    "registrants.userId"
  );
  if (!event) {
    res.status(404);
    throw new Error("Event not found.");
  }
  const registrant = event.registrants.find(
    (r) => r.userId._id.toString() === userId
  );
  if (!registrant) {
    res.status(404);
    throw new Error(
      "Registrant does not exist or is not attached to the event."
    );
  }

  return res.status(200).json({ registrant });
});

//@desc Add registrant by ID
//@route POST /api/admin/events/{{event_id}}/registrants/{{user_id}}
//@access Private
const attachRegistrantById = asyncHandler(async (req, res) => {
  const eventId = req.params.event_id;
  const userId = req.body.userId;

  const [event, user] = await Promise.all([
    Event.findOne({ _id: eventId }),
    User.findOne({ _id: userId }),
  ]);

  if (!event) {
    res.status(404);
    throw new Error("Event not found.");
  }

  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  const registrant = event.registrants.find(
    (r) => r.userId.toString() === userId
  );

  if (registrant) {
    res.status(400);
    throw new Error("Registrant already exists.");
  }

  const newRegistrant = { userId: userId };
  const additionalFieldsSchema = event.additionalFieldsSchema;
  additionalFieldsSchema.forEach((value, key) => {
    if (req.body[key]) {
      newRegistrant[key] = req.body[key].toString();
    } else {
      throw new Error(`Missing required field ${key}.`);
    }
  });

  await Event.updateOne(
    { _id: eventId },
    { $push: { registrants: newRegistrant } }
  );

  const updatedEvent = await Event.findOne({ _id: eventId }).populate(
    "registrants.userId"
  );

  const addedRegistrant = updatedEvent.registrants.find(
    (r) => r.userId._id.toString() === userId
  );

  return res.status(200).json({ registrant: addedRegistrant });
});

//@desc Update registrant by ID
//@route PATCH /api/admin/events/{{event_id}}/registrants/{{user_id}}
//@access Private
const patchRegistrantById = asyncHandler(async (req, res) => {
  const eventId = req.params.event_id;
  const { userId, ...additionalFields } = req.body;

  const event = await Event.findOne({ _id: eventId });
  if (!event) {
    res.status(404);
    throw new Error("Event not found.");
  }

  const registrant = event.registrants.find(
    (r) => r.userId.toString() === userId
  );
  if (!registrant) {
    res.status(404);
    throw new Error("Registrant is not attached to this event.");
  }

  const additionalFieldsSchema = event.additionalFieldsSchema;
  additionalFieldsSchema.forEach((value, key) => {
    if (additionalFields && additionalFields[key]) {
      registrant[key] = additionalFields[key].toString();
    }
  });

  await event.save();
  await event.populate(["registrants.userId"]);

  const populatedRegistrant = event.registrants.find(
    (r) => r.userId._id.toString() === userId
  );

  return res.status(200).json({ registrant: populatedRegistrant });
});

//@desc Delete registrant by ID
//@route DELETE /api/admin/events/{{event_id}}/registrants/{{user_id}}
//@access Private
const deleteRegistrantById = asyncHandler(async (req, res) => {
  const eventId = req.params.event_id;
  const userId = req.params.user_id;
  const updatedEvent = await Event.findOneAndUpdate(
    { _id: eventId },
    { $pull: { registrants: { userId: userId } } }
  );

  if (!updatedEvent) {
    res.status(404);
    throw new Error("Event not found.");
  }
  return res.status(200).json({ message: "Deleted registrant" });
});

module.exports = {
  getAllRegistrants,
  getRegistrantById,
  attachRegistrantById,
  patchRegistrantById,
  deleteRegistrantById,
};
