import express from "express";
import cloudinary from "../lib/cloudinary.js";
import Book from "../models/Book.js";
import protectRouter from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protectRouter, async (req, res) => {
  try {
    const { title, caption, image, rating } = req.body;
    if (!title || !caption || !image || !rating) {
      return res.status(400).send("Please fill all the fields");
    }

    const imageResponse = await cloudinary.uploader.upload(image);
    const imageUrl = imageResponse.secure_url;

    const newBook = new Book({
      title,
      caption,
      image: imageUrl,
      rating,
      user: req.user._id,
    });

    await newBook.save();
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/", protectRouter, async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 5;
    const skip = (page - 1) * limit;

    const books = await Book.find({ user: req.user._id })
      .skip(skip)
      .limit(limit)
      .populate("user", "username profilePicture");

    const totalBooks = await Book.countDocuments();

    res.send({
      books,
      currentPage: page,
      totalBooks: Math.ceil(totalBooks / limit),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/user", protectRouter, async (req, res) => {
  try {
    const books = await Book.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(books);
  } catch (error) {
    console.log("get user books error", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", protectRouter, async (req, res) => {
  try {
    // Kitabı bul
    const book = await Book.findById(req.params.id);

    // Kitap bulunamadı
    if (!book) {
      return res.status(404).send("Kitap bulunamadı");
    }

    // Yetkisiz kullanıcı
    if (book.user.toString() !== req.user._id) {
      return res.status(401).send("Yetkisiz kullanıcı");
    }

    // Cloudinary'den resmi sil
    if (book.image && book.image.includes("cloudinary")) {
      const publicId = book.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }

    // Kitabı sil
    await book.deleteOne();

    // Kitap başarıyla silindi
    res.send("Kitap başarıyla silindi");
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
