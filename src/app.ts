import express from "express";

const app = express();

// Routes
// HTTP methods: GET, POST, PUT, DELETE, PATCH
app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
  // res.send("Hello World");
});

export default app;
