import express from "express";
import { isAuth } from "../utils/jwt.js";
import Content from "../models/ContentModel.js";
import expressAsyncHandler from "express-async-handler";
import FeaturedContent from "../models/FeaturedContentModel.js";

export const contentRouter = express.Router();
const PAGE_SIZE = 10;

contentRouter.get(
  "/",
  // isAuth,
  expressAsyncHandler(async (req, res) => {
    const content = await Content.find();
    res.send(content);
  })
);

contentRouter.get(
  "/watch",
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
    const pageSize = PAGE_SIZE;
    const page = query.page || 1;
    const searchQuery = query.query || "";

    const queryFilter = searchQuery
      ? { title: { $regex: searchQuery, $options: "i" } }
      : {};
    const contents = await Content.find({
      ...queryFilter,
    })
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    const countContent = await Content.countDocuments({
      ...queryFilter,
    });

    res.send({
      contents,
      page,
      countContent: countContent,
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
  "/movies",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const movie = await Content.aggregate([
      { $match: { isSeries: false } },
      { $sample: { size: 1 } },
    ]);
    res.send(movie[0]);
  })
);
contentRouter.get(
  "/series",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const serie = await Content.aggregate([
      { $match: { isSeries: true } },
      { $sample: { size: 1 } },
    ]);
    res.send(serie[0]);
  })
);

contentRouter.get(
  "/featured/random",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const content = await FeaturedContent.find().populate("contentList").exec();
    res.send(content);
  })
);

contentRouter.get(
  "/featured/movies",
  // isAuth,
  expressAsyncHandler(async (req, res) => {
    const content = await FeaturedContent.find({ type: "Movie" })
      .populate("contentList")
      .exec();
    res.send(content);
  })
);
contentRouter.get(
  "/featured/series",
  // isAuth,
  expressAsyncHandler(async (req, res) => {
    const content = await FeaturedContent.find({ type: "Serie" })
      .populate("contentList")
      .exec();
    res.send(content);
  })
);

export default contentRouter;
