import express from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import userRouter from "./user/userRouter";

const app = express();
app.use(express.json());
// Routes
// HTTP methods: GET, POST, PUT, DELETE, PATCH
app.get("/", (req, res, next) => {
  res.json({ message: "Hello World" });
  // res.send("Hello World");
});

app.use("/api/users", userRouter);

app.use(globalErrorHandler);

export default app;
