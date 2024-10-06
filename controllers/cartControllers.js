const CartItem = require("../models/cartItemModel");
const Cart = require("../models/cartModel");
const customError = require("../utils/customError");

const createCart = async (userId) => {
  try {
    let newCart;
    if (userId) {
      newCart = await Cart.create({ user: userId, items: [] });
    } else {
      newCart = await Cart.create({ items: [] });
    }

    return newCart;
  } catch (error) {
    throw new Error(error);
  }
};

const getCart = async (userId, cartId, shouldPopulate = false) => {
  try {
    let query = await Cart.findOne({ user: userId, _id: cartId });

    if (shouldPopulate) {
      query = query.populate({
        path: "items",
        populate: {
          path: "product",
        },
      });
    }

    const cart = await query.exec();
    return cart;
  } catch (error) {
    throw new Error(error);
  }
};

//@desc get cart of a user populated with cartItem.
//route GET/api/cart/:cartId (anonymous cart id)
//access public

const getUserCart = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const cartId = req.params.cartId;

    const cart = await getCart(userId, cartId, true);

    if (!cart) {
      throw customError(404, "Cart not found!");
    }

    const totalItems = cart?.items.length;
    const subtotal = cart?.items.reduce((acc, cartItem) => {
      acc + cartItem.price;
    }, 0);

    const response = {
      ...cart,
      totalItems,
      subtotal,
    };

    res.status(200).send(response);
  } catch (error) {
    next(error);
  }
};

//@desc get cart of a user populated with cartItem.
//route POST/api/cart
//access public
const addToCart = async (req, res, next) => {
  try {
    const { productId, userId, cartId } = req.body;

    let cart = (await getCart(userId, cartId)) || (await createCart(userId));

    let itemExists = await CartItem.findOne({
      product: productId,
      _id: { $in: cart.items },
    });

    if (itemExists) {
      itemExists.quantity += 1;
      await itemExists.save();
    } else {
      const newCartItem = await CartItem.create({
        product: productId,
        quantity: 1,
      });

      cart.items.push(newCartItem._id);
      await cart.save();
    }

    res.status(200).send(cart);
  } catch (error) {
    next(error);
  }
};

//@desc get cart of a user populated with cartItem.
//route PATCH/api/cart/:id
//access public
const updateCartItem = async (req, res, next) => {
  try {
    const cartItemId = req.params.id;
    const { quantity } = req.body;

    if (quantity === 0) {
      await CartItem.deleteOne({ _id: cartItemId });
      return res.status(200).send({ message: "Cart item deleted" });
    }

    const updatedCartItem = await CartItem.findByIdAndUpdate(
      cartItemId,
      { $set: { quantity } },
      { new: true }
    );

    if (!updatedCartItem) {
      throw customError(404, "Cart item not found");
    }

    res.status(200).send(updateCartItem);
  } catch (error) {
    next(error);
  }
};

module.exports = { getUserCart, addToCart, updateCartItem };
