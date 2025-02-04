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
  resetPassword,
  changePassword,
  resetPasswordEmailRequest,
} = require("../controllers/userController");
const router = express.Router();

router.get("/", getAllUsers);
router.get("/:email", getSingleUser);
router.post("/login", loginUser);
router.post("/", registerUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.post("/logout", logoutUser);
router.post("/generateAuthToken", generateJwtToken);
router.post("/resetPasswordEmailRequest", resetPasswordEmailRequest);
router.put("/resetPassword", resetPassword);
router.put("/changePassword", changePassword);

module.exports = router;
