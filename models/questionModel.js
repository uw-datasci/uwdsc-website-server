const mongoose = require("mongoose");

const questionSchema = mongoose.Schema(
  {
    id: {
      type: String, // should be unique
      required: true,
    },
    role: {
      type: String,
      enum: [
        "dev",
        "education",
        "social_media",
        "marketing",
        "events",
        "design",
        "operations",
        "general",
      ],
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
  {
    _id: false, // Disable auto _id generation for subdocuments when used as embedded
  }
);

const questionModel = mongoose.model("questions", questionSchema);

module.exports = {
  questionSchema,
  questionModel,
};
