import express from "express";
import {
  createBook,
  updateBook,
  listBook,
  getSingleBook
} from "./bookController";
import multer from "multer";
import path from "node:path";
import authenticate from "../middlewares/authenticate";
const bookRouter = express.Router();

const upload = multer({
  dest: path.resolve(__dirname, "../../public/data/uploads"),
  limits: { fileSize: 1e7 }, //(3e7 = 30mb)
});
//routes
// create a book
bookRouter.post(
  "/",
  authenticate,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  createBook
);

//List all books
bookRouter.get("/", listBook);
bookRouter.get("/:bookId", getSingleBook);
// update book
bookRouter.patch(
  "/:bookId",
  authenticate,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  updateBook
);

export default bookRouter;
