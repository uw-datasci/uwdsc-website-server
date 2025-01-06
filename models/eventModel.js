const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const User = mongoose.model('users');
const {
  mapKeysValidator, 
  mapKeysErrorMessage
} = require("../models/validators");

const createUserRegistrantSchema = (additionalFieldsSchema) => {
  console.log(additionalFieldsSchema);
  if (additionalFieldsSchema) {
    return new mongoose.Schema(
      {
        user: {
          type: Map,
          of: mongoose.Schema.Types.Mixed,
          validate: {
            validator: mapKeysValidator(User.schema),
            message: mapKeysErrorMessage(User.schema),
          },
        },
        registrant: {
          type: Map,
          of: mongoose.Schema.Types.Mixed,
          validate: {
            validator: mapKeysValidator(additionalFieldsSchema),
            message: mapKeysErrorMessage(additionalFieldsSchema),
          },
        },
      },
      { _id: false }
    )
  } else {
    console.log("ENTERED");
    return new mongoose.Schema(
      {
        user: {
          type: Map,
          of: mongoose.Schema.Types.Mixed,
          validate: {
            validator: mapKeysValidator(User.Schema),
            message: mapKeysErrorMessage(User.Schema),
          },
        },
      },
      { _id: false }
    )
  }
};

const eventSchema = mongoose.Schema(
  {
    // Basic information for event
    name: {
      type: String,
      required: true
    },
    isRegistrationRequired: {
      type: Boolean,
      required: true,
      immutable: true,
    },
    description: {
      type: String
    },
    location: {
      type: String
    },
    startTime: {
      type: Date,
      required: true,
      validate: {
        validator: (startTime) =>  { console.log("start:", startTime); return startTime > new Date();}, // Ensure startTime is in the future
        message: "startTime must be in the future",
      }
    },
    endTime: {
      type: Date,
      required: true,
    },

    // Sensitve information for event
    // Used for QR payload
    secretName: {
      type: String,
      required: true,
      immutable: true,
      default: () => {return uuidv4()}
    },

    // Requirements for users to be checked-in
    requirements: {
      type: Map,
      of: mongoose.Schema.Types.Map,
      user: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        required: true
      },
      registrant: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
      },
      required: true
    },

    // What to display to admins during check-in
    toDisplay: {
      type: Map,
      of: mongoose.Schema.Types.Map,
      before: {
        type: Map,
        of: mongoose.Schema.Types.Map,
        user: {
          type: Map,
          of: mongoose.Schema.Types.Mixed,
          required: true
        },
        registrant: {
          type: Map,
          of: mongoose.Schema.Types.Mixed,
          default: {}
        },
        required: true
      },
      after: {
        type: Map,
        of: mongoose.Schema.Types.Map,
        user: {
          type: Map,
          of: mongoose.Schema.Types.Mixed,
          required: true
        },
        registrant: {
          type: Map,
          of: mongoose.Schema.Types.Mixed,
          default: {}
        },
        required: true
      },
      required: [true, "Please provide what to display before/after check-in"]
    },

    // Schema of additional fields, for now mainly for admin panel
    additionalFieldsSchema: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      required: true,
      default: {}
    },

    // All users that have registered for this event
    registrants: {
      type : [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: true 
          },
          checkedIn: {
            type: Boolean,
            required: true,
            default: false
          },
          additionalFields:{
            type: Map,
            of: mongoose.Schema.Types.Mixed
          }
        }
      ],
      required: true,
      default: []
    }
  },
  {
    timestamps: true
  }
);

/**
 * Validation function to ensure the map follows the schema and if not, throws and error
 * @param {mongoose.Schema} schema 
 * @param {mongoose.Map} map 
 * @param {function} next
 */
const mapValidator = (schema, map, next) => {
  console.log(map.keys());
  const valid = mapKeysValidator(schema)(map);

  if (!valid) {
    const errorMessage = mapKeysErrorMessage(schema)({ value: map});
    throw next(new Error(errorMessage));
  }
}

eventSchema.pre("validate", function (next) {
  if (this.startTime && this.endTime && this.startTime >= this.endTime) {
    return next(new Error('Start time must be before end time.'));
  }
  if (this.additionalFieldsSchema.keys().length > 0) {
    const schemaDefinition = {}
    this.additionalFieldsSchema.forEach((type, key) => {
      schemaDefinition[key] = {
        type: type
      };
    });

    const schema = new mongoose.Schema(schemaDefinition);
    const displayBeforeRegistrant = this.toDisplay.get("before").get("registrant");
    if (displayBeforeRegistrant && Object.entries(displayBeforeRegistrant).length !== 0) {
      mapValidator(schema, new Map(Object.entries(displayBeforeRegistrant)), next);
    }

    const displayAfterRegistrant = this.toDisplay.get("after").get("registrant");
    if (displayAfterRegistrant && Object.entries(displayAfterRegistrant).length !== 0) {
      mapValidator(schema, new Map(Object.entries(displayAfterRegistrant)), next);
    }

    mapValidator(schema, this.requirements.get("registrant"), next);
  }

  const displayBeforeUser = this.toDisplay.get("before").get("user");
  if (displayBeforeUser && Object.entries(displayBeforeUser).length !== 0) {
    console.log(displayBeforeUser);
    mapValidator(User.schema, new Map(Object.entries(displayBeforeUser)), next);
  }

  const displayAfterUser = this.toDisplay.get("after").get("user");
  if (displayAfterUser && Object.entries(displayAfterUser).length !== 0) {
    mapValidator(User.schema, new Map(Object.entries(displayAfterUser)), next);
  }

  mapValidator(User.schema, this.requirements.get("user"), next);

  next();
});

eventSchema.pre("save", async function (next) {
  if (!this.isRegistrationRequired && this.registrants.length == 0) {
    const allUsers = await User.find(); // Fetch all users
    this.registrants = allUsers.map((user) => ({
      userId: user._id,
      checkedIn: false,
    }));
  }
  next();
});

// Return all events that would happen from start to end
eventSchema.query.byDateRange = function (start, end) {
  return this.where("startTime").gte(start).lte(end);
};

// Return all event happening on dateTime
eventSchema.query.eventsHappeningOn = function (dateTime) {
  return this.where("startTime").lte(dateTime).where("endTime").gte(dateTime);
};

// Return all events happening before dateTime
eventSchema.query.eventsHappeningBefore = function (dateTime) {
  return this.where("startTime").lte(dateTime);
}

// Return all events happening after dateTime
eventSchema.query.eventsHappeningAfter = function (dateTime) {
  console.log(dateTime);
  return this.where("startTime").gte(dateTime);
};

// Return all events
eventSchema.query.allEvents = function () {
  return this;
}

eventSchema.virtual("registrantCount").get(function () {
  return this.registrants.length;
});

eventSchema.set("toJSON", { virtuals: true });
eventSchema.set("toObject", { virtuals: true });

eventSchema.index({ secretName: 1 }, { unique: true });
eventSchema.index({ startTime: 1 });

module.exports = mongoose.model("events", eventSchema);