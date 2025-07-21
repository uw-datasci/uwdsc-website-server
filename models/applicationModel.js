const mongoose = require("mongoose");
const { questionSchema } = require("./questionModel");

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

    // Roles applying for (up to 3, in order of preference)
    // First role is the most preferred, last is the least preferred
    rolesApplyingFor: {
      type: [String],
      enum: [
        "Events Exec",
        "Events Co-VP",
        "Design Exec",
        "Education Exec",
        "Internal Exec",
        "Outreach Exec",
        "Outreach Co-VP",
        "Development Exec",
        "Development Co-VP",
        "Social Media Exec",
        "Social Media VP",
      ],
      validate: {
        validator: function (roles) {
          // Must have at least 1 role and at most 3 roles
          if (
            this.status !== "draft" &&
            (roles.length < 1 || roles.length > 3)
          ) {
            return false;
          }
          // Check for duplicate roles
          return roles.length === new Set(roles).size;
        },
        message: "Must select 1-3 unique roles in order of preference",
      },
      required: [
        function () {
          return this.status !== "draft";
        },
        "Please select the roles you're applying for (1-3 roles)",
      ],
    },

    // Role-specific Question Answers
    // Answers to questions from the selected roles in the term's questions array
    // Structure: { role: { questionId: answer } }
    // Note: General questions (personal info, academic info, club experience) are stored under the "general" role
    roleQuestionAnswers: {
      type: Map,
      of: {
        type: Map,
        of: mongoose.Schema.Types.Mixed, // Store the actual answer values
      },
      default: new Map(),
      validate: {
        validator: async function (roleAnswers) {
          // Skip validation for draft applications
          if (this.status === "draft") {
            return true;
          }

          // Validate that all answered roles are in the rolesApplyingFor array or are "general"
          for (const role of roleAnswers.keys()) {
            if (
              !["general", "supplementary"].includes(role) &&
              !this.rolesApplyingFor.includes(role)
            ) {
              return false;
            }
          }

          return true;
        },
        message:
          "Question answers must correspond to the selected roles or general questions",
      },
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

// Helper method to validate question answers against term questions
applicationSchema.methods.validateQuestionAnswers = async function () {
  if (this.status === "draft") {
    return { valid: true, errors: [] };
  }

  try {
    // Populate the term to get questions
    await this.populate("termApplyingFor");

    const term = this.termApplyingFor;
    const errors = [];

    // Always validate general questions (required for all applications)
    const generalQuestions = term.getQuestionsForRole("general");
    const generalAnswers = this.roleQuestionAnswers.get("general") || new Map();

    for (const question of generalQuestions) {
      if (question.required && !generalAnswers.has(question.id)) {
        errors.push(
          `Required general question "${question.question}" is not answered`
        );
      }
    }

    // Check if all provided general answers correspond to valid questions
    for (const [questionId, answer] of generalAnswers.entries()) {
      const question = generalQuestions.find((q) => q.id === questionId);
      if (!question) {
        errors.push(
          `Answer provided for unknown general question ID: ${questionId}`
        );
      }
    }

    // Validate answers for each selected role
    for (const role of this.rolesApplyingFor) {
      const roleQuestions = term.getQuestionsForRole(role);
      const roleAnswers = this.roleQuestionAnswers.get(role) || new Map();

      // Check if all required questions are answered for this role
      for (const question of roleQuestions) {
        if (question.required && !roleAnswers.has(question.id)) {
          errors.push(
            `Required question "${question.question}" for role "${role}" is not answered`
          );
        }
      }

      // Check if all provided answers correspond to valid questions for this role
      for (const [questionId, answer] of roleAnswers.entries()) {
        const question = roleQuestions.find((q) => q.id === questionId);
        if (!question) {
          errors.push(
            `Answer provided for unknown question ID: ${questionId} in role "${role}"`
          );
        }
      }
    }

    // Validate supplementary questions
    const supplementaryQuestions = term.getQuestionsForRole("supplementary");
    const supplementaryAnswers =
      this.roleQuestionAnswers.get("supplementary") || new Map();

    for (const question of supplementaryQuestions) {
      if (question.required && !supplementaryAnswers.has(question.id)) {
        errors.push(
          `Required supplementary question "${question.question}" is not answered`
        );
      }
    }

    // Check for unkoown supplementary question IDs
    for (const [questionId, answer] of supplementaryAnswers.entries()) {
      const question = supplementaryQuestions.find((q) => q.id === questionId);
      if (!question) {
        errors.push(
          `Answer provided for unknown supplementary question ID: ${questionId}`
        );
      }
    }

    return { valid: errors.length === 0, errors };
  } catch (error) {
    return { valid: false, errors: [`Validation error: ${error.message}`] };
  }
};

// Helper method to get the preferred role (first in the list)
applicationSchema.methods.getPreferredRole = function () {
  return this.rolesApplyingFor && this.rolesApplyingFor.length > 0
    ? this.rolesApplyingFor[0]
    : null;
};

// Helper method to get answers for a specific role
applicationSchema.methods.getAnswersForRole = function (role) {
  return this.roleQuestionAnswers.get(role) || new Map();
};

// Helper method to get general answers (personal info, academic info, club experience)
applicationSchema.methods.getGeneralAnswers = function () {
  return this.roleQuestionAnswers.get("general") || new Map();
};

// Helper method to set answers for a specific role
applicationSchema.methods.setAnswersForRole = function (role, answers) {
  this.roleQuestionAnswers.set(role, new Map(Object.entries(answers)));
};

// Static method to get questions for specific roles from a term
applicationSchema.statics.getQuestionsForRoles = async function (
  termId,
  roles
) {
  const { termModel } = require("./termModel");
  try {
    const term = await termModel.findById(termId);
    if (!term) {
      throw new Error("Term not found");
    }

    const questionsForRoles = {};

    // Always include general and supplementary questions
    questionsForRoles["general"] = term.getQuestionsForRole("general");
    questionsForRoles["supplementary"] =
      term.getQuestionsForRole("supplementary");
    // Add questions for each selected role
    for (const role of roles) {
      questionsForRoles[role] = term.getQuestionsForRole(role);
    }

    return questionsForRoles;
  } catch (error) {
    throw new Error(`Error getting questions for roles: ${error.message}`);
  }
};

// Static method to get questions for a single role (backward compatibility)
applicationSchema.statics.getQuestionsForRole = async function (termId, role) {
  const { termModel } = require("./termModel");
  try {
    const term = await termModel.findById(termId);
    if (!term) {
      throw new Error("Term not found");
    }

    return term.getQuestionsForRole(role);
  } catch (error) {
    throw new Error(`Error getting questions for role: ${error.message}`);
  }
};

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
applicationSchema.index({ termApplyingFor: 1, rolesApplyingFor: 1, status: 1 });

const applicationModel = mongoose.model("applications", applicationSchema);

module.exports = {
  applicationSchema,
  applicationModel,
};
