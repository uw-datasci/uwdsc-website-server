const asyncHandler = require("express-async-handler");

const Event = require("../models/eventModel");
const { v4: uuidv4 } = require("uuid");

//@desc Get all events 
//@route GET /api/admin/events
//@access private
const getAllEvents = asyncHandler(async (req, res) => {
  const { fromDate, upToDate } = req.query;
  const fromDateObj = fromDate ? new Date(fromDate) : null;
  const upToDateObj = upToDate ? new Date(upToDate) : null;

  let events = [];
  try {
    if (fromDateObj && upToDateObj && fromDateObj !== upToDateObj) {
      events = await Event.find().byDateRange(fromDateObj, upToDateObj);
    } else if (fromDateObj && upToDateObj) {
      events = await Event.find().eventsHappeningOn(fromDateObj);
      console.log(events);
    } else if (fromDateObj) {
      events = await Event.find().eventsHappeningAfter(fromDateObj);
    } else if (upToDateObj) {
      events = await Event.find().eventsHappeningBefore(upToDateObj);
    } else {
      events = await Event.find().allEvents();
    }

    events = events.map(event => {
      const eventObject = event.toJSON();
      delete eventObject.registrants;

      return eventObject;
    });

    res.status(200).json(events);

  } catch (error) {
    console.error(error);
    throw err;
  }
});

//@desc Get event by ID
//@route GET /api/admin/events/:id
//@access private
const getEventById = asyncHandler(async (req, res) => {
  const id = req.params.event_id;
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
    requirements,
    toDisplay,
    additionalFieldsSchema
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
      requirements,
      toDisplay,
      additionalFieldsSchema
    });
    res.status(201).json({ _id: event.id });
  } catch (err) {
    console.log(err);
    throw err;
  }
});

//@desc Update an existing event
//@route PATCH /api/admin/events/:id
//@access private
const patchEventById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { ...fieldsToUpdate }  = req.body;

  const event = await Event.findById(id);
  if (!event) {
    res.status(404);
    throw Error("Unable to find event.");
  }

  const allowedKeys = Object.keys(Event.schema.obj);
  const validFields = allowedKeys.filter(key => key !== "registrants");
  const updatedFields = Object.fromEntries(
    Object.entries(fieldsToUpdate).filter(([ key ]) => validFields.includes(key))
  );

  const updatedEvent = await Event.findByIdAndUpdate(id, updatedFields, { returnDocument: 'after' });
  const eventObject = updatedEvent.toJSON();
  delete eventObject.registrants;

  res.status(200).json({ message: "Updated event", updatedEvent: eventObject });
});

//@desc Delete an existing event
//@route DELETE /api/admin/events/:id
//@access private
const deleteEventById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await Event.findByIdAndDelete(id);

  res.status(200).json({ message: "Event deleted successfully" });
});

module.exports = { getAllEvents, getEventById, createEvent, patchEventById, deleteEventById };