import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protectRouter = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    if (!token) {
      return res
        .status(401)
        .json({ message: "token olmadan giriş yapamazsınız." });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: "token olmadan giriş yapamazsınız." });
  }
};

export default protectRouter;
