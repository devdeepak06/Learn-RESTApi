import { Request, NextFunction, Response } from "express";
import cloudinary from "../config/cloudinary";
import path from "node:path";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from "node:fs";
import { AuthRequest } from "../middlewares/authenticate";

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre } = req.body;
  // console.log("File", req.files);
  // Call cloudinary
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  // application/pdf
  const coverImageMimeType = files.coverImage[0].mimetype.split("/").at(-1);
  const fileName = files.coverImage[0].filename;
  const filePath = path.resolve(
    __dirname,
    "../../public/data/uploads",
    fileName
  );
  const bookFileName = files.file[0].filename;
  const bookFilePath = path.resolve(
    __dirname,
    "../../public/data/uploads",
    bookFileName
  );

  try {
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      filename_override: fileName,
      folder: "book-covers",
      format: coverImageMimeType,
    });
    const bookFileUploadResult = await cloudinary.uploader.upload(
      bookFilePath,
      {
        filename_override: bookFileName,
        resource_type: "raw",
        folder: "book-pdfs",
        format: "pdf",
      }
    );
    const _req = req as AuthRequest;
    const newBook = await bookModel.create({
      title: title,
      genre: genre,
      author: _req.userId,
      coverImage: uploadResult.secure_url,
      file: bookFileUploadResult.secure_url,
    });

    // Delete Temp file
    await fs.promises.unlink(filePath);
    await fs.promises.unlink(bookFilePath);

    res.status(201).json({ id: newBook._id });
  } catch (err) {
    console.log(err);
    return next(createHttpError(500, "Error while uploading file."));
  }
};

const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, genre } = req.body;
    const bookId = req.params.bookId;

    const book = await bookModel.findOne({ _id: bookId });

    if (!book) {
      return next(createHttpError(404, "Book not found"));
    }

    // Check access
    const _req = req as AuthRequest;
    if (book.author.toString() !== _req.userId) {
      return next(createHttpError(403, "Unauthorized"));
    }

    // Check if image and file fields exist
    let completeCoverImage = "";
    let completeFileName = "";
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (files.coverImage) {
      const fileName = files.coverImage[0].filename;
      const coverMimeType = files.coverImage[0].mimetype.split("/").at(-1);
      const filePath = path.resolve(
        __dirname,
        "../../public/data/uploads",
        fileName
      );
      completeCoverImage = filePath;
      const uploadResult = await cloudinary.uploader.upload(filePath, {
        filename_override: completeCoverImage,
        folder: "book-covers",
        format: coverMimeType,
      });
      completeCoverImage = uploadResult.secure_url;
      await fs.promises.unlink(filePath);
    }

    if (files.file) {
      const bookFileName = files.file[0].filename;
      const bookFilePath = path.resolve(
        __dirname,
        "../../public/data/uploads",
        bookFileName
      );
      completeFileName = bookFileName;
      const uploadResultPdf = await cloudinary.uploader.upload(bookFilePath, {
        filename_override: completeFileName,
        resource_type: "raw",
        folder: "book-pdfs",
        format: "pdf",
      });
      completeFileName = uploadResultPdf.secure_url;
      await fs.promises.unlink(bookFilePath);
    }

    const updatedBook = await bookModel.findOneAndUpdate(
      {
        _id: bookId,
      },
      {
        title: title,
        genre: genre,
        coverImage: completeCoverImage ? completeCoverImage : book.coverImage,
        file: completeFileName ? completeFileName : book.file,
      },
      { new: true }
    );

    res.json(updatedBook);
  } catch (error) {
    next(error);
  }
};

// listbook method use to list all books
const listBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // todos: add pagination(using mongoose pagination)
    const book = await bookModel.find();

    return res.json(book);
  } catch (err) {
    return next(createHttpError(500, "Error while getting book"));
  }
};

// getSingleBook method
const getSingleBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const bookId = req.params.bookId;
  try {
    const book = await bookModel.findOne({ _id: bookId });
    if (!book) {
      return next(createHttpError(404, "Book not found"));
    }
    return res.json(book);
  } catch (err) {
    return next(createHttpError(500, "Error while getting a book"));
  }
};

const deleteBook = async (req: Request, res: Response, next: NextFunction) => {
  const bookId = req.params.bookId;
  try {
    const book = await bookModel.findOne({ _id: bookId });
    if (!book) {
      return next(createHttpError(404, "Book not found"));
    }
    //check access
    const _req = req as AuthRequest;
    if (book.author.toString() != _req.userId) {
      return next(createHttpError(403, "Unauthorized access"));
    }

    const coverFileSplits = book.coverImage.split("/");
    const coverImagePublicId =
      coverFileSplits.at(-2) + "/" + coverFileSplits.at(-1)?.split(".").at(-2);
    const bookFileSplits = book.file.split("/");
    const bookFilePublicId =
      bookFileSplits.at(-2) + "/" + bookFileSplits.at(-1);
    // console.log("coverFileSplits", coverFileSplits);
    // https://res.cloudinary.com/dkm44qhtl/image/upload/v1721556010/book-covers/fyebny0clvl2pwoxpjfl.jpg
    // book-covers/fyebny0clvl2pwoxpjfl
    // console.log("coverImagePublicId", coverImagePublicId);
    // https://res.cloudinary.com/dkm44qhtl/raw/upload/v1721558633/book-pdfs/znk6upznaibd5y5yy7de.pdf
    // book-pdfs/znk6upznaibd5y5yy7de.pdf
    // console.log("Book file spit", bookFilePublicId);
    //add error block
    // delete from cloudinary
    await cloudinary.uploader.destroy(coverImagePublicId);
    await cloudinary.uploader.destroy(bookFilePublicId, {
      resource_type: "raw",
    });
    //also delete from mongodb
    await bookModel.deleteOne({ _id: bookId });
    return res.sendStatus(201);
  } catch (err) {
    return next(createHttpError(500, "Book not found"));
  }
};

export { createBook, updateBook, listBook, getSingleBook, deleteBook };
