const express = require("express");
const { check } = require("express-validator");
const router = express.Router();

const userController = require("../controllers/users-controller");
const { getUsers, login, signUp } = userController;

router.get("/", getUsers);

router.post("/login", login);

router.post(
  "/signUp",
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  signUp
);

module.exports = router;
