const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const {
  mapKeysValidator,
  mapKeysErrorMessage,
} = require("../models/validators");
const { TYPE_CONSTANTS } = require("../constants");
const { addMinutes } = require("date-fns");
const { userSchema } = require("./userModel");

const eventSchema = mongoose.Schema(
  {
    // Basic information for event
    name: {
      type: String,
      required: true,
    },
    isRegistrationRequired: {
      type: Boolean,
      required: true,
      immutable: true,
    },
    description: {
      type: String,
    },
    location: {
      type: String,
    },
    startTime: {
      type: Date,
      required: true,
    },
    bufferedStartTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true,
    },
    bufferedEndTime: {
      type: Date,
      required: true,
    },

    // Sensitve information for event
    // Used for QR payload
    secretName: {
      type: String,
      required: true,
      immutable: true,
      default: () => {
        return uuidv4();
      },
    },

    // Requirements for users to be checked-in
    requirements: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      user: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
      },
      checkedIn: {
        type: Boolean,
        default: false
      },
      selected: {
        type: Boolean,
        default: true
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
        of: mongoose.Schema.Types.Mixed,
        user: {
          type: Map,
          of: mongoose.Schema.Types.Mixed,
          required: true
        },
        checkedIn: {
          type: String,
          default: "Checked In"
        },
        selected: {
          type: String,
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
        of: mongoose.Schema.Types.Mixed,
        user: {
          type: Map,
          of: mongoose.Schema.Types.Mixed,
          required: true
        },
        checkedIn: {
          type: String,
          default: "Checked In"
        },
        selected: {
          type: String,
        },
        registrant: {
          type: Map,
          of: mongoose.Schema.Types.Mixed,
          default: {}
        },
        required: true
      },
      required: [true, "Please provide what to display before/after check-in"],
    },

    // Schema of additional fields, for now mainly for admin panel
    additionalFieldsSchema: {
      type: Map,
      of: {
        type: String,
        enum: [TYPE_CONSTANTS.ARRAY, TYPE_CONSTANTS.STRING, TYPE_CONSTANTS.NUMBER, TYPE_CONSTANTS.BOOL], 
      },
      required: true,
      default: {}
    },

    // All users that have registered for this event
    registrants: {
      type: [
        {
          _id: false,
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true,
          },
          checkedIn: {
            type: Boolean,
            default: false,
            required: true,
          },
          selected: {
            type: Boolean,
            default: false,
            required: true,
          },
          status: {
            type: String,
            default: "Applied",
            required: true,
            enum: ["Accepted", "Confirmed", "Waitlist", "Rejected", "Expired", "Applied"]
          },
          additionalFields: {
            type: Map,
            of: mongoose.Schema.Types.Mixed
          },
        }
      ],
      required: true,
      default: []
    },

    subEvents: {
      type: [
        {
          _id: false,
          name: {
            type: String,
            required: true
          },
          description: {
            type: String,
            required: true
          },
          location: {
            type: String,
            required: true
          },
          startTime: {
            type: Date,
            required: true
          },
          bufferedStartTime: {
            type: Date,
            required: true
          },
          endTime: {
            type: Date,
            required: true
          },
          bufferedEndTime: {
            type: Date,
            required: true
          },
          checkedIn: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "users",
            required: true
          }
        }
      ],
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
 * @param {mongoose.Map} map | null 
 * @param {function} next
 */
const mapValidator = (schema, map, next) => {
  if (map && !mapKeysValidator(schema)(map)) {
    const errorMessage = mapKeysErrorMessage(schema)({ value: map });
    throw next(new Error(errorMessage));
  }
}

const convertInnerObjectsToMaps = (outerMap) => {
  return new Map(
    Array.from(outerMap, ([key, value]) => [
      key,
      value && typeof value === "object" ? new Map(Object.entries(value)) : value,
    ])
  );
}

eventSchema.pre("validate", function (next) {
  if (!this.isRegistrationRequired) {
    this.additionalFieldsSchema = {}
  }
  
  // To fix
  this.toDisplay = new Map([
    ["before", convertInnerObjectsToMaps(this.toDisplay.get("before"))],
    ["after", convertInnerObjectsToMaps(this.toDisplay.get("after"))]
  ]) 
  this.requirements.set("user", new Map(Object.entries(this.requirements.get("user"))));

  if (this.isNew && this.startTime < new Date()) {
    next(new Error("Start time must be before end time."));
  }

  if (this.startTime && this.endTime && this.startTime >= this.endTime) {
    return next(new Error("Start time must be before end time."));
  }

  const schemaDefinition = {}
  this.additionalFieldsSchema.forEach((type, key) => {
    schemaDefinition[key] = {
      type: type
    };
  });

  const schema = new mongoose.Schema(schemaDefinition);
  
  mapValidator(schema, this.toDisplay.get("before")?.get("registrant"), next);
  mapValidator(schema, this.toDisplay.get("after")?.get("registrant"), next);
  mapValidator(schema, this.requirements.get("registrant"), next);
  
  mapValidator(userSchema, this.toDisplay.get("before")?.get("user"), next);
  mapValidator(userSchema, this.toDisplay.get("after")?.get("user"), next);
  mapValidator(userSchema, this.requirements.get("user"), next);

  if (!this.bufferedStartTime) {
    this.bufferedStartTime = addMinutes(this.startTime, -20);
  } else if (this.bufferedStartTime > this.startTime) {
    throw next(new Error("bufferedStartTime must be before startTime"));
  }

  if (!this.bufferedEndTime) {
    this.bufferedEndTime = new Date(this.endTime);
  } else if (this.bufferedEndTime < this.endTime) {
    throw next(new Error("bufferedEndTime must be after endTime"));
  }

  if (!this.isRegistrationRequired && this.subEvents.length > 0) {
    throw next(new Error("Only events that require registration can have sub-events!"));
  }

  next();
});

eventSchema.pre("save", async function (next) {
  const User = mongoose.model("users");

  if (!this.isRegistrationRequired) {
    const allUsers = await User.find(); 
    this.registrants = allUsers.map((user) => ({
      user: user._id,
      selected: true
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

// Return all event happening on dateTime with buffer
eventSchema.query.eventsHappeningOnBuffered = function (dateTime) {
  return this.where("bufferedStartTime").lte(dateTime).where("bufferedEndTime").gte(dateTime);
};

// Return all events happening before dateTime
eventSchema.query.eventsHappeningBefore = function (dateTime) {
  return this.where("startTime").lte(dateTime);
}

// Return all events happening after dateTime
eventSchema.query.eventsHappeningAfter = function (dateTime) {
  return this.where("startTime").gte(dateTime);
};

// Return all events
eventSchema.query.allEvents = function () {
  return this;
}

eventSchema.virtual("registrantCount").get(function () {
  if (this.registrant) {
    return this.registrants.length;
  } else {
    return 0;
  }
});

eventSchema.set("toJSON", { virtuals: true });
eventSchema.set("toObject", { virtuals: true });

eventSchema.index({ secretName: 1 }, { unique: true });
eventSchema.index({ startTime: 1 });

const eventModel = mongoose.model("events", eventSchema); 
module.exports = {
    eventSchema,
    eventModel
}