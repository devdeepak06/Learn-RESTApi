import express from "express";
import cors from "cors";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import userRouter from "./user/userRouter";
import bookRouter from "./book/bookRouter";
import { config } from "./config/config";

const app = express();
app.use(
  cors({
    origin: config.frontEndUrl,
  })
);
app.use(express.json());
// Routes
// HTTP methods: GET, POST, PUT, DELETE, PATCH
app.get("/", (req, res, next) => {
  try {
    res.json({ message: "Welcome to the Elib Rest Api App." });
  } catch (error) {
    next(error);
  }
});

app.use("/api/users", userRouter);
app.use("/api/books", bookRouter);
app.use(globalErrorHandler);

export default app;
