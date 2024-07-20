import express from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import userRouter from "./user/userRouter";
import bookRouter from "./book/bookRouter";

const app = express();
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
app.use("api/books", bookRouter);
app.use(globalErrorHandler);

export default app;
