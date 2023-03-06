const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs')

const signUp = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }
  const { name, email, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }
  if (existingUser) {
    const error = new HttpError("User already existing", 422);
    return next(error);
  }

  let hashedPassword
  try {
    hashedPassword = await bcrypt.hash(password, 12)
  } catch (err) {
    const error = new HttpError(
      "Could not create user, please try again",
      500
    );
    return next(error);
  }
  
  const createdUser = new User({
    name,
    email,
    image:
      "https://www.google.com/imgres?imgurl=https%3A%2F%2Fbizweb.dktcdn.net%2Fthumb%2F1024x1024%2F100%2F438%2F322%2Fproducts%2Fkit-fl-fl750-obsidiant.jpg%3Fv%3D1673012958973&imgrefurl=https%3A%2F%2Fsoigear.vn%2Fkit-ban-phim-co-khong-day-mk750-3-modes-hotswap-mach-xuoi-hang-chinh-hang&tbnid=fGJGVNNPYfiJgM&vet=12ahUKEwjT-LGi_vj8AhXJ1XMBHfCjCB0QMygVegUIARDZAQ..i&docid=Y-mq6uF_WllzJM&w=1024&h=1024&itg=1&q=mk750%20keyboard&client=opera-gx&ved=2ahUKEwjT-LGi_vj8AhXJ1XMBHfCjCB0QMygVegUIARDZAQ",
    password: hashedPassword,
    places: [],
  });

  try {
    await createdUser.save();
  } catch (error) {
    return next(new HttpError("Signing up failed!", 500));
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      "supersecret",
      { expiresIn: "1h" }
    );
  } catch (error) {
    return next(new HttpError("Signing up failed!", 500));
  }

  res.status(201).json({ userId: createdUser.id, email: createdUser.email, token });
};

const getUsers = async (req, res, next) => {
  const userId = req.params.uid;
  let existingUsers;
  try {
    existingUsers = await User.find({}, "-password");
  } catch (error) {
    return next(
      new HttpError("Something went wrong! Cannot find any user.", 500)
    );
  }
  res
    .status(201)
    .json({ users: existingUsers.map((u) => u.toObject({ getters: true })) });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }
  if (!existingUser) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      401
    );
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password)
  } catch (err) {
    const error = new HttpError(
      "Could not log you in, please check your credentials and try again",
      401
    );
    return next(error)
  }

  if(!isValidPassword){
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      401
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      "supersecret",
      { expiresIn: "1h" }
    );
  } catch (error) {
    return next(new HttpError("Logging in failed!", 500));
  }
  res.json({userId: existingUser.id, email: existingUser.email, token});
};

exports.signUp = signUp;
exports.getUsers = getUsers;
exports.login = login;
