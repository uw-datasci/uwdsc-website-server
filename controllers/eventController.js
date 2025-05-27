const asyncHandler = require("express-async-handler");
const { default: mongoose } = require("mongoose");
const Event = mongoose.model("events");
const User = mongoose.model("users");

//@desc Get all events
//@route GET /api/admin/events
//@access private
const getAllEvents = asyncHandler(async (req, res) => {
  const { fromDate, upToDate, buffered } = req.query;
  const fromDateObj = fromDate ? new Date(fromDate) : null;
  const upToDateObj = upToDate ? new Date(upToDate) : null;

  let events = [];
  try {
    if (
      fromDateObj &&
      upToDateObj &&
      fromDateObj.getTime() !== upToDateObj.getTime()
    ) {
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

    events = events.map((event) => {
      const eventObject = event.toJSON();
      delete eventObject.registrants;
      delete eventObject.secretName;

      if (eventObject.subEvents) {
        eventObject.subEvents = eventObject.subEvents
          .filter((subEvent) => {
            const now = new Date();
            return (
              new Date(subEvent.bufferedStartTime) <= now &&
              new Date(subEvent.bufferedEndTime) >= now
            );
          })
          .map((subEvent) => {
            delete subEvent.checkedIn;

            return subEvent;
          });
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

  delete event.secretName;

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
    additionalFieldsSchema,
  } = req.body;

  try {
    // Get all current users
    const users = await User.find({});
    
    // Create registrants array with all users
    const registrants = users.map(user => ({
      user: user._id,
      hasPaid: true,
      checkedIn: false,
      selected: true
    }));

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
      additionalFieldsSchema,
      registrants
    };

    // Only set bufferedStartDate if bufferedStartTime was given
    if (bufferedStartTime) {
      newEventData.bufferedStartTime = new Date(bufferedStartTime);
    }

    // Only set bufferedEndTime if bufferedEndTime was given
    if (bufferedEndTime) {
      newEventData.bufferedEndTime = new Date(bufferedEndTime);
    }

    console.log("New event data:", newEventData);
    // Create the event
    const event = await Event.create(newEventData);
    res.status(201).json({
      message: "Event created successfully",
      eventId: event._id,
    });
  } 
  catch (err) {
    console.error(err);
    throw err;
  }
});

//@desc Update an existing event
//@route PATCH /api/admin/events/:id
//@access private
const patchEventById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { ...fieldsToUpdate } = req.body;

  const event = await Event.findById(id);
  if (!event) {
    res.status(404);
    throw Error("Unable to find event.");
  }

  const allowedKeys = Object.keys(Event.schema.obj);
  const validFields = allowedKeys.filter((key) => key !== "registrants");
  const updatedFields = Object.fromEntries(
    Object.entries(fieldsToUpdate).filter(([key]) => validFields.includes(key))
  );

  const updatedEvent = await Event.findByIdAndUpdate(id, updatedFields, {
    returnDocument: "after",
  });
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

//@desc Get the latest event
//@route GET /api/events/latest
//@access public
const getLatestEvent = asyncHandler(async (req, res) => {
    const now = new Date();
    const currentEvent = await Event.find({
        startTime: { $lte: now },
        endTime: { $gte: now }
    })
    .sort({ startTime: 1 })
    .limit(1)
    .populate("registrants.user");

    if (!currentEvent || currentEvent.length === 0) {
      return res.status(200).json(null);
    }

    res.status(200).json(currentEvent[0]);
});

module.exports = { getAllEvents, getEventById, createEvent, patchEventById, deleteEventById, getLatestEvent };
