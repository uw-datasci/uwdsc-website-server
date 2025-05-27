const asyncHandler = require("express-async-handler");
const { default: mongoose } = require("mongoose");
const bcrypt = require("bcrypt");
const { checkInById } = require("./adminController");
const User = mongoose.model("users");
const Event = mongoose.model("events");

//@desc Get all registrants
//@route GET /api/admin/events/{{event_id}}/registrants
//@access Private
const getAllRegistrants = asyncHandler(async (req, res) => {
  const eventId = req.params.event_id;

  const event = await Event.findOne({ _id: eventId }).populate(
    "registrants.user"
  );
  if (!event) {
    res.status(404);
    throw new Error("Event not found.");
  }

  const registrants = event.registrants;
  return res.status(200).json({ registrants });
});

//@desc Get registrant by ID
//      Defaults to called ID if none provided
//@route GET /api/admin/events/{{event_id}}/registrants/{{user_id}}
//@access Private
const getRegistrantById = asyncHandler(async (req, res) => {
  const eventId = req.params.event_id;

  const userId = (req.user.userStatus == "member") ? req.user.id : (req.params.user_id ?? req.user.id);

  const event = await Event.findOne({ _id: eventId }).populate(
    "registrants.user"
  );
  if (!event) {
    res.status(404);
    throw new Error("Event not found.");
  }

  let registrant = event.registrants.find(
    (r) => {
      return r.user?._id.toString() === userId
    }
  );
  if (!registrant) {
    res.status(404);
    throw new Error(
      "Registrant does not exist or is not attached to the event."
    );
  }

  let subEventsCheckedIn = []
  if (event.subEvents?.length > 0) {
    subEventsCheckedIn = event.subEvents.filter((subEvent) => {
      return subEvent.checkedIn?.includes(userId)
    }).map((subEvent) => {
      return subEvent._id.toString()
    })
  }

  return res.status(200).json({ registrant, subEventsCheckedIn });
});

//@desc Add registrant by ID
//@route POST /api/admin/events/{{event_id}}/registrants/{{user_id}}
//@access Private
const attachRegistrantById = asyncHandler(async (req, res) => {
  const eventId = req.params.event_id;
  const userId = (req.user.userStatus == "member") ? req.user.id : (req.body.userId ?? req.user.id);
  
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

  console.log(event.registrants)
  const registrant = event.registrants.find(
    (r) => r.user.toString() === userId
  );

  console.log(registrant)

  /*
  if (registrant) {
    res.status(400);
    throw new Error("Registrant already exists.");
  }
  */

  const additionalFieldsSchema = event.additionalFieldsSchema;
  additionalFieldsSchema.forEach((value, key) => {
    if (!req.body.additionalFields.hasOwnProperty(key)) {
      throw new Error(`Missing required field ${key}.`);
    }
  });
  const newRegistrant = { user: userId, checkedIn: false, selected: false, additionalFields: req.body.additionalFields };

  await Event.updateOne(
    { _id: eventId },
    { $addToSet: { registrants: newRegistrant } }
  )

  const updatedEvent = await Event.findOne({ _id: eventId }).populate(
    "registrants.user"
  );

  const addedRegistrant = updatedEvent.registrants.find(
    (r) => r.user?._id.toString() === userId
  );

  return res.status(200).json({ registrant: addedRegistrant });
});

//@desc Checks in registrant by ID
//@route PATCH /api/admin/events/{{event_id}}/registrants/checkin/{{user_id}}
//@access Private
const checkInRegistrantById = asyncHandler(async (req, res) => {
  const {event_id, user_id} = req.params;

  console.log("YESSSS")
  console.log(req.user.id, user_id)
  if (req.user.id !== user_id) {
    res.status(403);
    throw new Error("You are not authorized to check in another user.");
  }
  
  // const userSecret = req.body.eventSecret;
  const event = await Event.findOne({ _id: event_id });
  // const eventSecret = user_id + process.env.ACCESS_TOKEN_SECRET + event.secretName;
  const registrantIndex = event.registrants.findIndex(
    (r) => r.user.toString() === user_id
  );
  const registrant = event.registrants[registrantIndex];

  if (event && registrant) {
    console.log(registrant)
    // if (await bcrypt.compare(eventSecret, userSecret)){
      if (!registrant.checkedIn) {
        registrant.checkedIn = true;
        await Event.findOneAndUpdate(
          { _id: event_id }, 
          { $set: { [`registrants.${registrantIndex}.checkedIn`]: true } }
        )
        
        const user = await User.findOne({_id: registrant.user});
        registrant.user = user
        return res.status(200).json({registrant})
      } else {
        // res.status(500)
        // throw new Error("Registrant is already checked in")
      }
    // } else {
    //   res.status(500)
    //   throw new Error("Hash does not match")
    // }
  } else {
    res.status(404)
    throw new Error("Event id is not valid or user is not registered")
  }

})

const checkInRegistrantToSubEventById = asyncHandler(async (req, res) => {
  const {user_id, event_id, sub_event_id} = req.params;
  const userSecret = req.body.eventSecret;
  const event = await Event.findOne({ _id: event_id });
  const eventSecret = user_id + process.env.ACCESS_TOKEN_SECRET + event.secretName;
  const registrantIndex = event.registrants.findIndex(
    (r) => r.user.toString() === user_id
  );
  const registrant = event.registrants[registrantIndex];
  const subEventIndex = await event.subEvents.findIndex(
    (r) => r._id.toString() === sub_event_id
  );
  const subEvent = event.subEvents[subEventIndex];

  console.log(subEventIndex);

  if (event && registrant && subEvent) {
    if (await bcrypt.compare(eventSecret, userSecret)){
      if (!subEvent.checkedIn.includes(user_id)) {
        registrant.checkedIn = true;
        await Event.findOneAndUpdate(
          { _id: event_id }, 
          { $push: { [`subEvents.${subEventIndex}.checkedIn`]: user_id } }
        )
        
        const user = await User.findOne({_id: registrant.user});
        registrant.user = user
        return res.status(200).json({registrant})
      } else {
        res.status(500)
        throw new Error("Registrant is already checked in")
      }
    } else {
      res.status(500)
      throw new Error("Hash does not match")
    }
  } else {
    res.status(404)
    throw new Error("User, Event, or Sub Event id is not valid")
  }

})

//@desc Update registrant by ID
//@route PATCH /api/admin/events/{{event_id}}/registrants/{{user_id}}
//@access Private
const patchRegistrantById = asyncHandler(async (req, res) => {
  const isMember = req.user.userStatus == "member"; 
  const eventId = req.params.event_id;
  const { checkedIn, selected, ...additionalFields } = req.body;
  const userId = (isMember) ? req.user.id : req.params.user_id;

  const event = await Event.findOne({ _id: eventId })
  if (!event) {
    res.status(404);
    throw new Error("Event not found.");
  }

  const registrant = event.registrants.find(
    (r) => r.user.toString() === userId
  );
  if (!registrant) {
    res.status(404);
    throw new Error("Registrant is not attached to this event.");
  }

  const additionalFieldsSchema = event.additionalFieldsSchema;
  additionalFieldsSchema.forEach((value, key) => {
    if (additionalFields && additionalFields.additionalFields[key]) {
      registrant.additionalFields.set(key, additionalFields.additionalFields[key]);
    }
  });

  if (!isMember && checkedIn != undefined) {
    registrant.checkedIn = checkedIn;
  }

  if (!isMember && selected != undefined) {
    registrant.selected = selected;
  }

  await event.save();

  return res.status(200).json({ registrant });
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
  checkInRegistrantById,
  checkInRegistrantToSubEventById,
  patchRegistrantById,
  deleteRegistrantById,
};
