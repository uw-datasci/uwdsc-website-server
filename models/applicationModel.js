const mongoose = require("mongoose");

const isRequiredUnlessDraft = function () {
  return this.status !== "draft";
};

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

    // Section 1: Personal Information
    personalInfo: {
      uwEmail: {
        type: String,
        required: [isRequiredUnlessDraft, "Please add the user's UW email"],
      },
      personalEmail: {
        type: String,
        required: [isRequiredUnlessDraft, "Please add the user's personal email"],
      },
      fullName: {
        type: String,
        required: [isRequiredUnlessDraft, "Please add the user's full name"],
      },
    },

    // Section 2: Academic Information
    academicInfo: {
      program: {
        type: String,
        required: [isRequiredUnlessDraft, "Please add the user's program"],
      },
      academicTerm: {
        type: String,
        required: [isRequiredUnlessDraft, "Please add the user's academic term"],
      },
      location: {
        type: String,
        enum: [
          "Study Term",
          "Co-op Term in Waterloo",
          "Co-op Term but can commute to Waterloo",
          "Co-op term not in Waterloo",
          "",
        ],
        required: [isRequiredUnlessDraft, "Please add the user's location"],
      },
    },

    // Section 3: Club Experience
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

    // Section 4: Dynamic Questions
    questionAnswers: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: new Map(),
    },

    // Resume
    resumeUrl: {
      type: String,
      required: [isRequiredUnlessDraft, "Please add the user's resume URL"],
    },

    // Application Status
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
    
    comments: {
      type: String,
      required: false,
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

// Automatically update timestamps and set submittedAt
applicationSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  if (
    this.isModified("status") &&
    this.status === "submitted" &&
    !this.submittedAt
  ) {
    this.submittedAt = new Date();
  }

  next();
});

// Indexes for efficient querying
applicationSchema.index({ userId: 1, termApplyingFor: 1 }, { unique: true });
applicationSchema.index({ termApplyingFor: 1, status: 1 });

const applicationModel = mongoose.model("applications", applicationSchema);

module.exports = {
  applicationSchema,
  applicationModel,
};
