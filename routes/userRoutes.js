const express = require("express");
const {
  getAllUsers,
  getSingleUser,
  registerUser,
  updateUser,
  deleteUser,
  logoutUser,
} = require("../controllers/userController");
const router = express.Router();

router.get("/", getAllUsers);
router.get("/:email", getSingleUser);
router.post("/", registerUser);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);
router.post("/logout", logoutUser);

module.exports = router;
