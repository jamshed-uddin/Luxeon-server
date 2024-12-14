const express = require("express");
const {
  getAllProducts,
  getSingleProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteImage,
  uploadImage,
} = require("../controllers/productControllers");
const upload = require("../middlewares/multerUploadMid");
const router = express.Router();

router.get("/", getAllProducts);
router.get("/:id", getSingleProduct);
router.post("/", createProduct);
router.patch("/:id", updateProduct);
router.delete("/:id", deleteProduct);
router.post("/uploadImage", upload, uploadImage);
router.delete("/deleteImage/:publicId", deleteImage);

module.exports = router;
