const express = require("express");
const {
  getAllUsers,
  getSingleUser,
  registerUser,
  updateUser,
  deleteUser,
  logoutUser,
  loginUser,
  generateJwtToken,
} = require("../controllers/userController");
const router = express.Router();

router.get("/", getAllUsers);
router.get("/:email", getSingleUser);
router.post("/login", loginUser);
router.post("/", registerUser);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);
router.post("/logout", logoutUser);
router.post("/generateAuthToken", generateJwtToken);

module.exports = router;
