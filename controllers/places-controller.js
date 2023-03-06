const { v4: uuidv4 } = require("uuid");
const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const Place = require("../models/place");
const getCoordsForAddress = require("../util/location");
const User = require("../models/user");
const mongoose = require("mongoose");
const {ErrorModel} = require('../models/models')

const model = mongoose.model()

//  TODO: replace later
const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong. Could not find a place for the provided id.",
      500
    );
    // return next(res.status(500).json({error}));
    return next(error);
  }
  if (!place) {
    return next(
      new HttpError("Could not find a place for the provided id.", 404)
    );
  }
  res.json({ place: place.toObject({ getters: true }) });
  // res.json({ place });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  // * Simple way
  // let place;
  // try {
  //   place = await Place.find({ creator: userId});
  // } catch (err) {
  //   const error = new HttpError(
  //     "Something went wrong. Could not find a place for the provided id.",
  //     500
  //   );
  //   // return next(res.status(500).json({error}))
  //   return next(error);
  // }

  // if (!place || place.length === 0) {
  //   return next(
  //     new HttpError("Could not find places for the provided id.", 404)
  //   );
  // }
  // // console.log('GET request in places')
  // res.json({ place: place.map((p) => p.toObject({ getters: true })) });

  // * Alternative way
  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate("places");
  } catch (error) {
    const err = new ErrorModel("Could not find user with provided id.", 404)
    return next(res.status(404).json({errorMessage: "Could not find user with provided id.", code: 404}));
  }

  if (!userWithPlaces || userWithPlaces.length === 0) {
    return next(
      new HttpError("Could not find places for the provided id.", 404)
    );
  }

  res.json({ places: userWithPlaces.places.map(p => p.toObject({ getters: true })) });
};

const createPlace = async (req, res, next) => {
  const {} = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(new HttpError("Invalid inputs passed, please check your data", 422));
  }
  const { title, description, address, creator } = req.body;
  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }
  const createdPlace = new Place({
    title,
    description,
    location: coordinates,
    address,
    creator,
    image:
      "https://www.google.com/search?q=wiki&client=opera-gx&sxsrf=AJOqlzUPHfwKUqhwKDoLvL0wWImN_Ximew:1675332432160&tbm=isch&source=iu&ictx=1&vet=1&fir=ZT5GFkBXiefrmM%252CFLsl-5XVkcE0VM%252C%252Fm%252F0d07ph%253BldbwqTBt1_CD4M%252C_y8Q6Mg4kYu3dM%252C_%253B1UZXjKSWhoah2M%252C_y8Q6Mg4kYu3dM%252C_%253BoqtUw3iNSm3FiM%252C83teytlx0n-nvM%252C_%253B-hUX98mkwPLltM%252C_y8Q6Mg4kYu3dM%252C_%253ButeJswQOhmawDM%252ChFb0pViDITQIRM%252C_&usg=AI4_-kQvx0PiMdsXXuWfCtE5hf8NHaakOw&sa=X&ved=2ahUKEwjYk__Ty_b8AhVa8HMBHamGCAMQ_B16BAhSEAE#imgrc=ZT5GFkBXiefrmM",
  });
  let user;
  try {
    user = await User.findById(creator);
  } catch (error) {
    return next(
      new HttpError(
        "Creating place failed! Could not find provided user id",
        500
      )
    );
  }

  if (!user) {
    return next(new HttpError("Could not find user id", 404));
  }

  try {
    // * Process multiple sessions. In this case: save createdPlace in Place model first
    // * then save new place id to user.places.
    // * If both are successful, mongoose will commit transaction to save both changes.
    // * If one is failed, mongoose will return error.
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (error) {
    return next(new HttpError("Creating place failed!", 500));
  }
  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }
  const placeId = req.params.pid;
  const { title, description } = req.body;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find place by provided id.",
      500
    );
    return next(error);
  }
  place.title = title;
  place.description = description;
  try {
    await place.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place.",
      500
    );
    return next(error);
  }
  res.status(201).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find place by provided id.",
      500
    );
    return next(error);
  }

  if (!place) {
    return next(new HttpError("Could not find place id", 404));
  }
  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await place.remove({ session });
    place.creator.places.pull(place);
    await place.creator.save({ session });
    await session.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place.",
      500
    );
    return next(error);
  }
  res.status(201).json("Deleted place.");
};

exports.deletePlace = deletePlace;
exports.updatePlace = updatePlace;
exports.createPlace = createPlace;
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
