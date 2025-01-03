const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const User = mongoose.model("users");
const {
  mapKeysValidator,
  mapKeysErrorMessage,
} = require("../models/validators");

const createUserRegistrantSchema = (additionalFieldsSchema) => {
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
    );
  } else {
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
    );
  }
};

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
      validate: {
        validator: (startTime) => startTime > new Date(), // Ensure startTime is in the future
        message: "startTime must be in the future",
      },
    },
    endTime: {
      type: Date,
      required: true,
      validate: {
        validator: (endTime) => endTime > this.startTime, // Ensure endTime is after startTime
        message: "endTime must be after startTime",
      },
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
      type: createUserRegistrantSchema(this.additionalFieldsSchema),
      required: true,
    },

    // What to display to admins during check-in
    toDisplay: {
      type: {
        before: {
          type: createUserRegistrantSchema(this.additionalFieldsSchema),
        },
        after: {
          type: createUserRegistrantSchema(this.additionalFieldsSchema),
        },
      },
      required: [true, "Please provide what to display before/after check-in"],
    },

    // Schema of additional fields, for now mainly for admin panel
    additionalFieldsSchema: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // All users that have registered for this event
    registrants: {
      type: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true,
          },
          checkedIn: {
            type: Boolean,
            default: false,
          },
          additionalFields: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

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
  return this.where("startDate").lte(dateTime).where("endDate").gte(dateTime);
};

eventSchema.virtual("registrantCount").get(function () {
  return this.registrants.length;
});

eventSchema.index({ secretName: 1 }, { unique: true });
eventSchema.index({ startTime: 1 });

module.exports = mongoose.model("events", eventSchema);
