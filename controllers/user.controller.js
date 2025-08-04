import User from "../models/user.model.js";
import { errorHandler } from "../utils/error.js";
import cloudinary from "../utils/cloudinary.js";
import bcrypt from "bcryptjs";
import Listing from "../models/listing.model.js";

export const uploadProfilePic = async (req, res, next) => {
  try {
    if (req.file) {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "mern-estate/avatars",
      });

      // Update user in database
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        {
          avatar: result.secure_url,
          avatarPublicId: result.public_id,
        },
        { new: true }
      );

      return res.status(200).json(updatedUser);
    }

    return next(errorHandler(400, "No file provided"));
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  //console.log(req.user);
  console.log("req.user.id:", req.user.id);
  console.log("req.params.id:", req.params.id);

  if (req.user.id !== req.params.id) {
    return next(errorHandler(403, "Forbidden"));
  }
  try {
    if (req.body.password) {
      req.body.password = bcrypt.hashSync(req.body.password, 10);
    }
    const updateUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          username: req.body.username,
          email: req.body.email,
          password: req.body.password,
          avatar: req.body.avatar,
        },
      },
      { new: true }
    );

    const { password, ...rest } = updateUser._doc;
    res.status(200).json({
      success: true,
      message: "User updated successfully!",
      user: rest,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  if (req.user.id !== req.params.id)
    return next(errorHandler(401, "You can only delete your own account!"));
  try {
    await User.findByIdAndDelete(req.params.id);
    res
      .clearCookie("token")
      .status(200)
      .json({ message: "User has been delete..." });
  } catch (error) {
    next(error);
  }
};

export const getUserListings = async (req, res, next) => {
  if (req.user.id === req.params.id) {
    try {
      const listings = await Listing.find({ userRef: req.params.id });
      res.status(200).json(listings);
    } catch (error) {
      next(error);
    }
  } else {
    return next(errorHandler(401, "You can only view your own listings "));
  }
};
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(errorHandler(404, "User not found!"));
    const { password: pass, ...rest } = user._doc;
    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};
