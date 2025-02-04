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
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);
router.post("/image/uploadImage", upload, uploadImage);
router.post("/image/deleteImage", deleteImage);

module.exports = router;
