const Users = require("../models/userModel");
const customError = require("../utils/customError");
const generateToken = require("../utils/generateToken");

//@desc register user
//route POST/api/users/login
//access public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      throw customError(401, "Email required");
    }

    const user = await Users.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const { password: passcode, ...userData } = user._doc;
      res.status(200).send(userData);
    } else {
      throw customError(400, "Invalid credentails");
    }

    // generateToken(res, user._id);
  } catch (error) {
    next(error);
  }
};

//@desc register user
//route POST/api/users/
//access public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email) {
      throw customError(401, "Fill up the required field");
    }

    const user = await Users.findOne({ email });

    if (user) {
      // generateToken(res, user._id);
      throw customError(309, "This email already in use");
    }
    const createdUser = await Users.create({ name, email, password });
    const { password: passcode, ...userData } = createdUser;
    // generateToken(res, createdUser._id);
    res.status(201).send(userData);
  } catch (error) {
    next(error);
  }
};

//@desc get all users with filters and pagination
//route GET/api/users/
//access admin only
const getAllUsers = async (req, res, next) => {
  try {
    const searchQuery = query.q;
    const page = +query.page || 1;
    const limit = +query.limit || 10;

    let filter = {};
    if (searchQuery) {
      filter.name = filter.title = { $regex: new RegExp(searchQuery, "i") };
    }

    const allUsers = await Users.find(filter)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1, role: -1 })
      .exec();

    const users = await Users.find(filter);
    const totalUsers = users?.length;

    const totalPages = Math.ceil(totalUsers / limit);
    const hasMore = limit > allUsers.length;

    const response = {
      data: allProducts,
      pagination: {
        page,
        limit,
        totalPages,
        totalProducts,
        hasMore,
      },
    };

    res.status(200).send(response);
  } catch (error) {
    next(error);
  }
};

//@desc get single users
//route GET/api/users/:email
//access public
const getSingleUser = async (req, res, next) => {
  try {
    const userEmail = req.params.email;

    const user = await Users.findOne({ email: userEmail });
    if (!user) {
      throw customError(404, "User not found");
    }

    res.status(200).send(user);
  } catch (error) {
    next(error);
  }
};

//@desc update  user info
//route GET/api/users/:id
//access public (user himself only)
const updateUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    const updatedInfo = req.body;
    const user = await Users.findOne({ _id: id });
    if (!user) {
      throw customError(404, "User not found");
    }

    const updatedUser = await Users.findByIdAndUpdatefindOneAndUpdate(
      { _id: id },
      updatedInfo,
      { new: true }
    );

    res.status(200).send(updatedUser);
  } catch (error) {
    next(error);
  }
};

//@desc logout user(clearing the cookie)
//route POST/api/users/logout
//access public (user himself only)
const logoutUser = async (req, res, next) => {
  try {
    res.cookie("jwt", "", {
      httpOnly: true,
      expires: new Date(0),
    });

    res.status(200).send({ message: "User logged out" });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginUser,
  getAllUsers,
  getSingleUser,
  registerUser,
  updateUser,
  deleteUser,
  logoutUser,
};
