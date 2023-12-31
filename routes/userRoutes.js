import express, { request } from "express";
import expressAsyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import User from "../models/UserModel.js";
import Content from "../models/ContentModel.js";
import { generateToken, isAuth } from "../utils/jwt.js";

const userRouter = express.Router();

userRouter.post(
  "/signin",
  expressAsyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });

    if (user) {
      await user.populate("myFavouriteList");
      if (bcrypt.compareSync(password, user.password)) {
        res.send({
          _id: user._id,
          username: user.username,
          email: user.email,
          token: generateToken(user),
          myList: user.myFavouriteList,
        });
        return;
      }
    }
    res.status(401).send({ message: "Invalid Credentials" });
  })
);

userRouter.post(
  "/signup",
  expressAsyncHandler(async (req, res) => {
    const { password, email } = req.body;
    try {
      const newUser = new User({
        username: email.split("@")[0],
        email: email,
        password: bcrypt.hashSync(password, 10),
      });
      const user = await newUser.save();
      await user.populate("myFavouriteList");
      res.send({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user),
        myList: user.myFavouriteList,
      });
    } catch (error) {
      res.status(400).send({ message: "E-Mail already in database" });
    }
  })
);

userRouter.get(
  "/list",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const userId = req.user._id;

    const currUser = await User.findById(userId)
      .populate("myFavouriteList")
      .exec();
    if (!currUser) {
      return res
        .status(404)
        .send({ message: `User with ID ${userId} not found.` });
    }

    res
      .status(200)
      .send([
        { _id: userId, name: "My List", contentList: currUser.myFavouriteList },
      ]);
  })
);

userRouter.post(
  "/list",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { contentId } = req.body;

    const IsValidContent = await Content.findById(contentId);
    const currUser = await User.findById(userId);
    try {
      if (!IsValidContent) throw new Error(`Invalid content id: ${contentId}.`);

      currUser.myFavouriteList.push(contentId);
      currUser.save();
    } catch (error) {
      throw new Error(error.message);
    }

    res.status(201).send({
      userList: currUser.myFavouriteList,
      message: "Added requested content to the user's list.",
    });
  })
);

userRouter.delete(
  "/list",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { contentId } = req.query;
    console.log(contentId);

    const currUser = await User.findById(userId);
    try {
      if (!currUser) throw new Error(`Invalid user id: ${userId}.`);

      currUser.myFavouriteList.pull(contentId);

      await currUser.save();
    } catch (error) {
      throw new Error(error.message);
    }

    res.status(204).end();
  })
);

userRouter.get("/", isAuth, async (req, res) => {
  res.status(200).send({ message: "Ok" });
});

export default userRouter;
