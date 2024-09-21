const mongoose = require("mongoose");

const eventSchema = mongoose.Schema(
{
  eventName: {
    type: String
  },
}
);

module.exports = mongoose.model("events", eventSchema);