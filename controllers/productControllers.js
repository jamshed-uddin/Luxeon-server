const Products = require("../models/productModel");
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

    let filter = {};

    if (category) {
      filter.category = new RegExp(category, "i");
    }

    if (searchQuery) {
      filter.title = { $regex: new RegExp(searchQuery, "i") };
    }

    if (query.minPrice) {
      filter.price = { $gte: query.minPrice };
    }
    if (query.maxPrice) {
      filter.price = { $lte: query.maxPrice };
    }

    let sortBy = { createdAt: -1 };
    if (query?.sort) {
      sortBy[query?.sort] = -1;
    }

    const allProducts = await Products.find(filter)
      .skip((page - 1) * limit)
      .sort(sortBy)
      .exec();

    const products = await Products.find(filter).exec();
    const totalProducts = products?.length;
    const totalPages = Math.ceil(totalProducts / limit);
    const hasMore = limit > allProducts.length;
    const response = {
      message: "Products retrieved",
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

    res.status(200).send({
      message: "Product data retrieved",
      data: product,
    });
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
    const createdProduct = await Products.create({
      productInfo,
    });
    res.status(201).send({
      message: "Product created successfully",
      data: { productId: createdProduct._id },
    });
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

    res.status(200).send({
      message: "Product data updated",
      data: { productId: updatedProduct._id },
    });
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

module.exports = {
  getAllProducts,
  getSingleProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
