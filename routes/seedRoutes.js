import express from "express";
import { isAuth } from "../utils/jwt.js";
import {
  data,
  genres,
  listMovieNames,
  listSeriesNames,
} from "../models/data.js";
import Content from "../models/ContentModel.js";
import User from "../models/UserModel.js";
import FeaturedContent from "../models/FeaturedContentModel.js";

export const seedRouter = express.Router();

seedRouter.get("/", isAuth, async (req, res) => {
  try {
    await Content.deleteMany({}); //delete by filtering
    await User.deleteMany({}); //delete by filtering
    await FeaturedContent.deleteMany({}); //delete by filtering

    const createdContents = await Content.insertMany(data.content);
    const createdUsers = await User.insertMany(data.users);

    const FeaturedMovies = await getRandomContent(listMovieNames, "Movie");
    const FeaturedSeries = await getRandomContent(listSeriesNames, "Serie");

    const createdFeaturedContent = await FeaturedContent.insertMany([
      ...FeaturedMovies,
      ...FeaturedSeries,
    ]);

    res.send({
      createdFeaturedContent,
      createdContents,
      createdUsers,
    });
  } catch (e) {
    console.log("failed to update " + e.message);
  }
});

const getRandomContent = async (nameArray, contentType) => {
  const isSeries = contentType === "Serie" ? true : false;
  const res = [];

  for (let i = 0; i < nameArray.length; i++) {
    const selectedContent = await Content.aggregate([
      { $match: { isSeries: isSeries } },
      { $sample: { size: 12 } },
    ]);

    const contentToInsert = new FeaturedContent({
      name: nameArray[i],
      type: contentType,
      genre: genres[i],
      contentList: selectedContent,
    });

    res.push(contentToInsert);
  }

  return res;
};

export default seedRouter;
