const mongoose = require("mongoose");

const applicationSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: [true, "Please add the user ID"],
    },
    termApplyingFor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "terms",
      required: [true, "Please add the term applying for"],
    },

    // Section 1: Personal Information (fixed structure)
    personalInfo: {
      uwEmail: {
        type: String,
        required: [true, "Please add the user's UW email"],
      },
      personalEmail: {
        type: String,
        required: [true, "Please add the user's personal email"],
      },
      fullName: {
        type: String,
        required: [true, "Please add the user's full name"],
      },
    },

    // Section 2: Academic Information (fixed structure)
    academicInfo: {
      program: {
        type: String,
        required: [true, "Please add the user's program"],
      },
      academicTerm: {
        type: String,
        required: [true, "Please add the user's academic term"],
      },
      location: {
        type: String,
        required: [true, "Please add the user's location"],
        enum: [
          "Study Term",
          "Co-op Term in Waterloo",
          "Co-op Term but can commute to Waterloo",
          "Co-op term not in Waterloo",
        ],
      },
    },

    // Section 3: Past Experience with Club (fixed structure)
    clubExperience: {
      previousMember: {
        type: Boolean,
        default: false,
      },
      previousExperience: {
        type: String,
        default: "",
      },
    },

    // Section 4: Variable Questions (dynamic based on term)
    questionAnswers: {
      type: Map,
      of: mongoose.Schema.Types.Mixed, // Flexible to handle different answer types
      default: new Map(),
    },

    // Resume upload
    resumeUrl: {
      type: String,
      required: [true, "Please add the user's resume URL"],
    },

    // Application status tracking
    status: {
      type: String,
      enum: [
        "draft",
        "submitted",
        "under_review",
        "accepted",
        "rejected",
        "waitlisted",
      ],
      default: "draft",
      required: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to update updatedAt and handle submission
applicationSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  // Set submittedAt when status changes to submitted
  if (
    this.isModified("status") &&
    this.status === "submitted" &&
    !this.submittedAt
  ) {
    this.submittedAt = new Date();
  }

  next();
});

// Index for efficient queries
applicationSchema.index({ userId: 1, termApplyingFor: 1 }, { unique: true });
applicationSchema.index({ termApplyingFor: 1, status: 1 });

const applicationModel = mongoose.model("applications", applicationSchema);

module.exports = {
  applicationSchema,
  applicationModel,
};
