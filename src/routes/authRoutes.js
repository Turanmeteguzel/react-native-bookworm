import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15d" });
};

router.post("/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).send("Please fill all the fields");
    }

    if (password.length < 6) {
      return res.status(400).send("Password must be at least 6 characters");
    }

    if (username.lenght < 3) {
      return res.status(400).send("Username must be at least 3 characters");
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).send("kullanıcı adı zaten kullanılıyor");
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).send("email zaten kullanılıyor");
    }

    // profilresmi oluşturma
    const profilePicture = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

    const user = new User({
      email,
      username,
      password,
      profilePicture,
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        password: user.password,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Please fill all the fields");
  }

  const user = await User.findOne({ email });

  const ispasswordValid = await user.comparePassword(password);

  if (!ispasswordValid) {
    return res.status(400).send("email veya şifre yanlış");
  }

  const token = generateToken(user._id);

  res.status(201).json({
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      password: user.password,
      profilePicture: user.profilePicture,
    },
  });
});

export default router;
