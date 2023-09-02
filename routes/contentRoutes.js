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
  "/watch",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const { id } = req.query; // Get the ID from the query parameter
    const requestedContent = await Content.findById(id);

    requestedContent
      ? res.send(requestedContent)
      : res.status(404).send({ message: "Content not found" });
  })
);

contentRouter.get(
  "/genres",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const genres = await Content.find().distinct("genre");
    res.send(genres);
  })
);

contentRouter.get(
  "/search",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const searchQuery = query.q || "";

    const queryFilter = searchQuery
      ? { title: { $regex: searchQuery, $options: "i" } }
      : {};

    const contents = await Content.find({
      ...queryFilter,
    });

    const countContent = await Content.countDocuments({
      ...queryFilter,
    });

    res.send({
      contents,
      countContent: countContent,
    });
  })
);

contentRouter.get(
  "/:type",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const { type } = req.params;
    console.log(type);
    const content = await Content.aggregate([
      type === "all"
        ? { $sample: { size: 1 } }
        : { $match: { isSeries: type === "Series" ? true : false } },
      { $sample: { size: 1 } },
    ]);
    res.send(content[0]);
  })
);

contentRouter.get(
  "/featured/:type",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const { type } = req.params;
    // Process the filter parameter and retrieve data accordingly
    const content = await FeaturedContent.find(
      type === "all" ? {} : { type: type }
    )
      .populate("contentList")
      .exec();

    return res.status(200).send(content);
  })
);

export default contentRouter;
