import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel";
import bcrypt from "bcrypt";
import { sign } from "jsonwebtoken";
import { config } from "../config/config";
import { User } from "./userTypes";
const createUser = async (req: Request, res: Response, next: NextFunction) => {
  // Validation
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    const error = createHttpError(400, "All fields are required");
    return next(error);
  }

  // Database call
  try {
    const user = await userModel.findOne({ email });
    if (user) {
      const error = createHttpError(
        400,
        "User already exists with this email."
      );
      return next(error);
    }
  } catch (err) {
    return next(createHttpError(500, "Error while creating user."));
  }

  //Password -> Hash
  const hashedPassword = await bcrypt.hash(password, 10);
  let newUser: User;
  try {
    newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });
  } catch (err) {
    return next(createHttpError(500, "Error while creating user."));
  }

  //Token generation JWT
  try {
    const token = sign({ sub: newUser._id }, config.jwtSecret as string, {
      expiresIn: "7d",
      algorithm: "HS256",
    });

    //Process

    //Response
    res.status(201).json({ accessToken: token });
    // res.json({ message: "User Created Successfully" });
  } catch (err) {
    return next(createHttpError(500, "Error while signing the jwt token."));
  }
};

// const loginUser = async (req: Request, res: Response, next: NextFunction) => {
//   const { email, password } = req.body;
//   if (!email || !password) {
//     return next(createHttpError(400, "All fields are required"));
//   }

//   const user = await userModel.findOne({ email });
//   try {
//     if (!user) {
//       return next(createHttpError(404, "Invalid credentials"));
//     }
//   } catch (err) {
//     return next(createHttpError(500, "Error while logging in"));
//   }

//   const isMatch = await bcrypt.compare(password, user.password);
//   try {
//     if (!isMatch) {
//       return next(createHttpError(400, "Username or password is incorrect"));
//     }
//   } catch (err) {
//     return next(createHttpError(400, "Username or password is not matched"));
//   }

//   // create a new accesstoken
//   const token = sign({ sub: user._id }, config.jwtSecret as string, {
//     expiresIn: "7d",
//     algorithm: "HS256",
//   });

//   res.status(200).json({ accessToken: token });
// };

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(createHttpError(400, "All fields are required"));
  }

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return next(createHttpError(404, "Invalid credentials"));
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return next(createHttpError(400, "Username or password is incorrect"));
    }

    // Create a new access token
    const token = sign({ sub: user._id }, config.jwtSecret as string, {
      expiresIn: "7d",
      algorithm: "HS256",
    });

    res.status(200).json({ accessToken: token });
  } catch (err) {
    return next(createHttpError(500, "Error while logging in"));
  }
};
export { createUser, loginUser };
