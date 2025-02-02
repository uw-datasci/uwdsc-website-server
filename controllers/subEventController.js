const asyncHandler = require("express-async-handler");
const { default: mongoose } = require("mongoose");
const Event = mongoose.model("events");

const createSubEvent = asyncHandler(async (req, res) => {
  const event_id = req.params.event_id;
  const {
    name,
    description,
    location,
    startTime,
    endTime,
  } = req.body;

  try {
    // Basic event data
    const newSubEventData = {
      name,
      description,
      location,
      startTime: new Date(startTime),
      endTime: new Date(endTime)
    };

    // Create the event
    await Event.updateOne(
      { _id: event_id },
      { $push: { subEvents: newSubEventData } }
    )

    res.status(201).json({ subEvent: newSubEventData });
  } catch (err) {
    console.error(err);
    throw err;
  }
});

module.exports = { createSubEvent }