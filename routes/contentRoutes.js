import express from "express";
import { isAuth } from "../utils/jwt.js";
import Content from "../models/ContentModel.js";
import expressAsyncHandler from "express-async-handler";
import FeaturedContent from "../models/FeaturedContentModel.js";

export const contentRouter = express.Router();

contentRouter.get(
  "/",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const content = await Content.find();
    res.send(content);
  })
);

contentRouter.get(
  "/id/:id",
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const contentById = await Content.findById(id);

    contentById
      ? res.send(contentById)
      : res.status(404).send({ message: "Content not found" });
  })
);

contentRouter.get(
  "/search",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const PAGE_SIZE = 10;

    const { query } = req;

    const pageSize = PAGE_SIZE;
    const page = query.page || 1;
    const searchQuery = query.query || "";

    const queryFilter = searchQuery
      ? { title: { $regex: searchQuery, $options: "i" } }
      : {};

    const content = await Content.find({
      ...queryFilter,
    })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    const countContent = await Content.countDocuments({
      ...queryFilter,
    });
    res.send({
      content,
      page,
      countContent,
      pages: Math.ceil(countContent / pageSize),
    });
  })
);

contentRouter.get(
  "/random",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const content = await Content.aggregate([{ $sample: { size: 1 } }]);
    res.send(content[0]);
  })
);

contentRouter.get(
  "/featured",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const content = await FeaturedContent.find().populate("contentList").exec();
    res.send(content);
  })
);

export default contentRouter;
