const asyncHandler = require("express-async-handler");

const Event = require("../models/eventModel");

//@desc Get all events 
//@route GET /api/admin/events
//@access private
const getAllEvents = asyncHandler(async (req, res) => {

});

//@desc Get event by ID
//@route GET /api/admin/events/:id
//@access private
const getEventById = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const event = await Event.findOne({ _id: id });
  if (!event) {
    res.status(404);
    throw Error("Unable to find event.");
  }

  res.status(200).json(event);
});

//@desc Create a new event
//@route POST /api/admin/events
//@access private
const createEvent = asyncHandler(async (req, res) => {
  const {
    name,
    isRegistrationRequired,
    description,
    location,
    startTime,
    endTime,
    secretName,
    requirements,
    toDisplay,
    additionalFieldsSchema,
    registrants
  } = req.body;

  try {
    console.log(req.body);
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    console.log(endDate > startDate);
    const event = await Event.create({
      name,
      isRegistrationRequired,
      description,
      location,
      startTime,
      endTime,
      secretName,
      requirements,
      toDisplay,
      additionalFieldsSchema,
      registrants
    });
    console.log(`Event created ${event}`);
    res.status(201).json({ _id: event.id });
  } catch (err) {
    console.log(err);
    res.status(500);
    throw new Error("Failed to create event");
  }
});

module.exports = { getAllEvents, getEventById, createEvent };