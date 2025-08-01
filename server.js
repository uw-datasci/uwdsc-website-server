const express = require("express");
const connectDb = require("./config/dbConnection");
const { errorHandler } = require("./middleware/errorHandler");
const dotenv = require("dotenv").config();
const cors = require("cors");
require("./models/eventModel");
require("./models/userModel");
require("./models/termModel");
require("./models/applicationModel");

connectDb();
const app = express();

const port = process.env.PORT || 5001; // Ensure this matches the port your server is running on

// CORS configuration for all routes and origins
// TODO: REMOVE ALLOW ALL ORIGIN BEFORE RELEASE
app.use(
  cors({
    origin: "*", // Allow all origins
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true, // Allow cookies to be sent with requests
  })
);

app.use(express.json());
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/events", require("./routes/eventRoutes"));
app.use("/api/hello", require("./routes/helloRoutes"));
app.use("/api/applications", require("./routes/applicationRoutes"));
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
