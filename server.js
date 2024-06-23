require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000; // Use port 5000 or use the one provided by environment

// Define a route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
