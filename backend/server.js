import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcrypt-nodejs";

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/authAPI";
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  accessToken: {
    type: String,
    default: () => crypto.randomBytes(128).toString("hex"),
  },
});

const ImageSchema = new mongoose.Schema({
  image: String,
});

const Image = mongoose.model("Image", ImageSchema);
const User = mongoose.model("User", UserSchema);

const authenticateUser = async (req, res, next) => {
  const accessToken = req.header("Authorization");
  try {
    const loggedUser = await User.findOne({ accessToken });
    if (loggedUser) {
      next();
    } else {
      res.status(401).json({
        response: {
          message: "Please, log in",
        },
        success: false,
      });
    }
  } catch (error) {
    res.status(400).json({ response: error, success: false });
  }
};

//   PORT=9000 npm start
const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

// Start defining your routes here
app.get("/", authenticateUser);
app.get("/", async (req, res) => {
  try {
    const data = await Image.find();
    if (data) {
      res
        .status(200)
        .json({ response: { image: data[0].image }, success: true });
    } else {
      res.status(400).json({ response: "No image found", success: false });
    }
  } catch (error) {
    res.status(401).json({ response: error, success: false });
  }
});

app.post("/signup", async (req, res) => {
  const { username, password, email } = req.body;
  const salt = bcrypt.genSaltSync();
  try {
    const newUser = await new User({
      username,
      password: bcrypt.hashSync(password, salt),
      email,
    }).save();

    res.status(201).json({
      response: { name: newUser.username, id: newUser._id },
      success: true,
    });
  } catch (error) {
    res.status(400).json({ response: error, success: false });
  }
});

app.post("/image", async (req, res) => {
  const { image } = req.body;
  try {
    const newImage = await new Image({
      image,
    }).save();

    res.status(201).json({
      response: { image: newImage.image },
      success: true,
    });
  } catch (error) {
    res.status(400).json({ response: error, success: false });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const loggedUser = await User.findOne({ username });
    if (loggedUser && bcrypt.compareSync(password, loggedUser.password)) {
      res.status(200).json({
        response: {
          username: loggedUser.username,
          userId: loggedUser._id,
          accessToken: loggedUser.accessToken,
        },
        success: true,
      });
    } else {
      res
        .status(401)
        .json({ response: "User or password not found", success: false });
    }
  } catch (error) {
    res.status(400).json({ response: error, success: false });
  }
});

// Start the server
app.listen(port, () => {
  // eslint-disable-next-line
  console.log(`Server running on http://localhost:${port}`);
});
