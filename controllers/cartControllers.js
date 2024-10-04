const Cart = require("../models/cartItemModel");

const getCart = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const cart = await Cart.find({ user: userId }).populate("product");

    const totalItems = cart?.length;
    const subtotal = cart?.reduce((acc, cartItem) => {
      acc + cartItem.price;
    }, 0);

    const response = {
      totalItems,
      subtotal,
      cartItems: cart,
    };

    res.status(200).send(response);
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { product, quantity } = req.body;

    let cartItem = await Cart.findOne({ user: userId, product });

    if (cartItem) {
      cartItem.quantity += quantity || 1;
      await cartItem.save();
    } else {
      cartItem = new Cart({
        user: userId,
        product,
        quantity: quantity || 1,
      });
      await cartItem.save();
    }

    res.status(200).send(cartItem);
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
  } catch (error) {
    next(error);
  }
};

module.exports = { getCart, addToCart, updateCartItem };
