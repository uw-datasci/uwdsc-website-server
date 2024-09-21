const express = require('express');
const connectDb = require("./config/dbConnection");
const errorHandler = require("./middleware/errorHandler");
const dotenv = require("dotenv").config();
const cors = require('cors');
const sendEmail = require('./sendEmail');

connectDb();
const app = express();

const port = 5001; // Ensure this matches the port your server is running on

// CORS configuration for all routes and origins
// TODO: REMOVE ALLOW ALL ORIGIN BEFORE RELEASE
app.use(cors({
  origin: '*', // Allow all origins
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Allow cookies to be sent with requests
}));

app.use(express.json());
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/hello", require("./routes/helloRoutes"));
app.use(errorHandler);

app.get('/send-email', async (req, res) => {
    const result = await sendEmail();
    res.json(result);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});