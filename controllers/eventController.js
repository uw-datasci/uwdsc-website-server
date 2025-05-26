const asyncHandler = require("express-async-handler");
const { default: mongoose } = require("mongoose");
const Event = mongoose.model("events");

//@desc Get all events 
//@route GET /api/admin/events
//@access private
const getAllEvents = asyncHandler(async (req, res) => {
  const { fromDate, upToDate, buffered } = req.query;
  const fromDateObj = fromDate ? new Date(fromDate) : null;
  const upToDateObj = upToDate ? new Date(upToDate) : null;

  let events = [];
  try {
    if (fromDateObj && upToDateObj && fromDateObj.getTime() !== upToDateObj.getTime()) {
      events = await Event.find().byDateRange(fromDateObj, upToDateObj);
    } else if (fromDateObj && upToDateObj) {
      if (buffered) {
        events = await Event.find().eventsHappeningOnBuffered(fromDateObj);
      } else {
        events = await Event.find().eventsHappeningOn(fromDateObj);
      }
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
      delete eventObject.secretName;

      if (eventObject.subEvents) {
        eventObject.subEvents = eventObject.subEvents.filter(subEvent => {
          const now = new Date();
          return (new Date(subEvent.bufferedStartTime) <= now && new Date(subEvent.bufferedEndTime) >= now)
        }).map(subEvent => {
          delete subEvent.checkedIn;
  
          return subEvent;
        })
      }

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
  const event = (await Event.findOne({ _id: id })).toJSON();
  if (!event) {
    res.status(404);
    throw Error("Unable to find event.");
  }

  delete event.secretName

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
    bufferedStartTime,
    endTime,
    bufferedEndTime,
    requirements,
    toDisplay,
    additionalFieldsSchema
  } = req.body;

  try {
    // Basic event data
    const newEventData = {
      name,
      isRegistrationRequired,
      description,
      location,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      requirements,
      toDisplay,
      additionalFieldsSchema
    };

    // Only set bufferedStartDate if bufferedStartTime was given
    if (bufferedStartTime) {
      newEventData.bufferedStartTime = new Date(bufferedStartTime);
    }

    // Only set bufferedEndTime if bufferedEndTime was given
    if (bufferedEndTime) {
      newEventData.bufferedEndTime = new Date(bufferedEndTime);
    }

    // Create the event
    const event = await Event.create(newEventData);
    res.status(201).json({ _id: event.id });
  } catch (err) {
    console.error(err);
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

//@desc Get the earliest event starting today
//@route GET /api/events/latest
//@access Private
const getLatestEvent = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const latestEvent = await Event.findOne({
    startTime: { $gte: today } // today
  })
    .sort({ startTime: 1 }) 
    .populate("registrants.user");

  // if (!latestEvent) {
  //   res.status(404);
  //   throw new Error("No upcoming events found.");
  // }

  return res.status(200).json({ event: latestEvent });
});

module.exports = { getAllEvents, getEventById, createEvent, patchEventById, deleteEventById, getLatestEvent };