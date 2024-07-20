import { Request, NextFunction, Response } from "express";
import cloudinary from "../config/cloudinary";
import path from "node:path";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from "node:fs";

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
    
    const newBook = await bookModel.create({
      title: title,
      genre: genre,
      author: "669bab5a15045f0cf1fd0137",
      coverImage: uploadResult.secure_url,
      file: bookFileUploadResult.secure_url,
    });
    
    // Delete Temp file
    await fs.promises.unlink(filePath);
    await fs.promises.unlink(bookFilePath);
    
    // console.log("bookfilepath", bookFileUploadResult);
    // console.log("uploadResult", uploadResult);
    // @ts-expect-error
    console.log("User Id", req.userId);
    res.status(201).json({ id: newBook._id });
  } catch (err) {
    console.log(err);
    return next(createHttpError(500, "Error while uploading file."));
  }
};

export { createBook };
