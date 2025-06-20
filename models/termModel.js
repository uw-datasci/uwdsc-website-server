const mongoose = require("mongoose");

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
    appDeadline: {
      type: Date,
      required: [true, "Please add the application deadline"],
    },
    questions: {
      type: [
        {
          _id: false, // Disable auto _id generation for subdocuments
          id: {
            type: String, // should be unique
            required: true,
          },
          type: {
            type: String,
            enum: [
              "text",
              "textarea",
              "multiple_choice",
              "file_upload",
              "checkbox",
              "date",
              "number",
            ],
            required: true,
          },
          question: {
            type: String,
            required: true,
          },
          required: {
            type: Boolean,
            default: false,
          },
          order: {
            type: Number,
            required: true,
          },
          // Type-specific fields
          maxLength: {
            type: Number,
            validate: {
              validator: function (value) {
                return !value || ["text", "textarea"].includes(this.type);
              },
              message: "maxLength is only valid for text and textarea fields",
            },
          },
          options: {
            type: [String],
            validate: {
              validator: function (value) {
                return (
                  !value || ["multiple_choice", "checkbox"].includes(this.type)
                );
              },
              message:
                "options is only valid for multiple_choice and checkbox fields",
            },
          },
          acceptedTypes: {
            type: [String],
            validate: {
              validator: function (value) {
                return !value || this.type === "file_upload";
              },
              message: "acceptedTypes is only valid for file_upload fields",
            },
          },
          placeholder: String,
          helpText: String,
        },
      ],
      default: [],
      validate: {
        validator: function (questions) {
          // Check for unique question IDs
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

// Pre-save middleware to sort questions by order
termSchema.pre("save", function (next) {
  if (this.questions && this.questions.length > 0) {
    this.questions.sort((a, b) => a.order - b.order);
  }
  next();
});

// Index for efficient queries
termSchema.index({ termName: 1 });
termSchema.index({ appReleaseDate: 1, appDeadline: 1 });

const termModel = mongoose.model("terms", termSchema);

module.exports = {
  termSchema,
  termModel,
};
