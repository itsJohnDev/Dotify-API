const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const userRouter = require("./routes/userRoutes");
const { StatusCodes } = require("http-status-codes");

// Load environment variables
dotenv.config();

// Initialize app
const app = express();

// Connect to database
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Database Connected");
  })
  .catch((err) => {
    console.log("Error connecting to the database", err.message);
  });

//   Pass incoming data
app.use(express.json());

//   Routes
app.use("/api/users", userRouter);

// Error Handling Middleware
// Not Found 404
app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = StatusCodes.NOT_FOUND;
  next(error);
});

// Global error handler
app.use((err, req, res, next) => {
  res.status(err.status || StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: err.message || "Internal Server Error",
    status: "error",
  });
});
//   Start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
