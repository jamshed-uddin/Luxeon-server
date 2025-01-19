const Products = require("../models/productModel");
const { uploadToCloud, deleteFromCloud } = require("../utils/cloudinaryOps");
const customError = require("../utils/customError");

//@desc get all products with filters and pagination
//route GET/api/products/
//access public
const getAllProducts = async (req, res, next) => {
  try {
    const query = req.query;
    const searchQuery = query.q;
    const page = +query.page || 1;
    const limit = +query.limit || 15;
    const category = query.category || "";
    const stock = query.inStock || false;

    let filter = {};

    if (category) {
      filter.category = new RegExp(category, "i");
    }

    if (searchQuery) {
      filter.title = { $regex: new RegExp(searchQuery, "i") };
    }

    if (stock) {
      filter.stock = { $gt: 0 };
    }

    if (query.minPrice) {
      filter.price = { $gte: query.minPrice };
    }
    if (query.maxPrice) {
      filter.price = { $lte: query.maxPrice };
    }

    let sortBy = { createdAt: -1 };
    if (query?.sort) {
      sortBy[query?.sort] =
        query?.order && query?.order.toLowerCase() === "desc" ? -1 : 1;
    }

    const allProducts = await Products.find(filter)
      .skip((page - 1) * limit)
      .sort(sortBy)
      .exec();

    const products = await Products.find(filter).exec();
    const totalProducts = products?.length;
    const totalPages = Math.ceil(totalProducts / limit);
    const hasMore = limit > allProducts?.length;
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

//@desc get single product
//route GET/api/products/:id
//access public
const getSingleProduct = async (req, res, next) => {
  try {
    const id = req.params.id;

    const product = await Products.findOne({ _id: id });
    if (!product) {
      throw customError(404, "Product not found");
    }

    res.status(200).send(product);
  } catch (error) {
    next(error);
  }
};

//@desc update product
//route POST/api/products/
//access admin only
const createProduct = async (req, res, next) => {
  try {
    const productInfo = req.body;
    const createdProduct = await Products.create(productInfo);
    res.status(201).send({ productId: createdProduct._id });
  } catch (error) {
    next(error);
  }
};

//@desc update product
//route PATCH/api/products/:id
//access admin only
const updateProduct = async (req, res, next) => {
  try {
    const id = req.params.id;
    const updatedInfo = req.body;

    const product = await Products.findOne({ _id: id });

    if (!product) {
      throw customError(404, "Product not found");
    }

    const updatedProduct = await Products.findOneAndUpdate(
      { _id: id },
      updatedInfo,
      { new: true }
    );

    res.status(200).send({ product: updatedProduct });
  } catch (error) {
    next(error);
  }
};

//@desc delete product
//route DELETE/api/products/:id
//access admin only
const deleteProduct = async (req, res, next) => {
  try {
    const id = req.params.id;

    const product = await Products.findOne({ _id: id });

    if (!product) {
      throw customError(404, "Product not found");
    }

    await Products.deleteOne({ _id: id });

    res.status(200).send({
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

//@desc upload image for product
//route POST/api/products/uploadImage
//access private
const uploadImage = async (req, res, next) => {
  try {
    const files = req.files;

    if (!files.length || !files) {
      throw customError(400, "File is missing");
    }

    const uploadPromisses = files?.map((file) => uploadToCloud(file));

    const uploadResult = await Promise.all(uploadPromisses);

    res.status(200).send({ urls: uploadResult });
  } catch (error) {
    next(error);
  }
};

const deleteImage = async (req, res, next) => {
  try {
    const { publicIds } = req.body;
    if (!publicIds?.length) {
      throw customError(400, "PublicId is missing");
    }
    await deleteFromCloud(publicIds);
    res.status(200).send({ message: "Image deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getSingleProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
  deleteImage,
};
