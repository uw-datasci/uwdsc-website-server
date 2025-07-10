const mongoose = require("mongoose");
const { questionSchema } = require("./questionModel");

const termSchema = mongoose.Schema(
  {
    termName: {
      type: String,
      required: [true, "Please add the term name"],
      unique: true,
    },
    appReleaseDate: {
      type: Date,
      required: [true, "Please add the application release date"],
    },
    appSoftDeadline: {
      type: Date,
      required: [true, "Please add the application soft deadline"],
    },
    appHardDeadline: {
      type: Date,
      required: [true, "Please add the application hard deadline"],
    },
    questions: {
      type: [questionSchema],
      default: [],
      validate: {
        validator: function (questions) {
          // Check for unique question IDs across all questions
          const ids = questions.map((q) => q.id);
          return ids.length === new Set(ids).size;
        },
        message: "Question IDs must be unique within a term",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to sort questions by role and then by order
termSchema.pre("save", function (next) {
  if (this.questions && this.questions.length > 0) {
    this.questions.sort((a, b) => {
      // First sort by role (general first, then alphabetically)
      if (a.role === "general" && b.role !== "general") return -1;
      if (a.role !== "general" && b.role === "general") return 1;
      if (a.role !== b.role) return a.role.localeCompare(b.role);
      
      // Then sort by order within the same role
      return a.order - b.order;
    });
  }
  next();
});

// Helper method to get questions for a specific role
termSchema.methods.getQuestionsForRole = function (role) {
  return this.questions.filter(q => q.role === role);
};

// Helper method to get questions for multiple roles
termSchema.methods.getQuestionsForRoles = function (roles) {
  const questionsForRoles = {};
  roles.forEach(role => {
    questionsForRoles[role] = this.questions.filter(q => q.role === role);
  });
  return questionsForRoles;
};

// Helper method to get all available roles in this term
termSchema.methods.getAvailableRoles = function () {
  const roles = new Set(this.questions.map(q => q.role));
  return Array.from(roles);
};

// Index for efficient queries
termSchema.index({ termName: 1 });
termSchema.index({ appReleaseDate: 1, appSoftDeadline: 1, appHardDeadline: 1 });

const termModel = mongoose.model("terms", termSchema);

const { questionModel } = require("./questionModel");

module.exports = {
  termSchema,
  termModel,
  questionModel,
};
