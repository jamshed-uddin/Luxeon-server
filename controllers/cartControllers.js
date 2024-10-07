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
    let filter = {};
    if (userId) {
      filter.user = userId;
    }

    if (cartId) {
      filter._id = cartId;
    }

    let query = Cart.findOne(filter);

    if (shouldPopulate) {
      query = query.populate({
        path: "items",
        populate: {
          path: "product",
        },
      });
    }

    const cart = await query.lean();
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
    const userId = req?.user?._id;
    const cartId = req.params.id;

    const cart = await getCart(userId, cartId, true);

    if (!cart) {
      throw customError(404, "Cart not found!");
    }

    const totalItems = cart?.items.reduce((acc, item) => {
      return acc + item.quantity;
    }, 0);
    const subtotal = cart?.items.reduce((acc, item) => {
      return acc + item.product.price * item.quantity;
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
    const { productId, quantity, userId, cartId } = req.body;

    if (!productId || !quantity || quantity < 1) {
      throw customError(400, "Product id and valid quantity is required");
    }

    let cart = (await getCart(userId, cartId)) || (await createCart(userId));

    let itemExists = await CartItem.findOne({
      product: productId,
      _id: { $in: cart.items },
    });

    if (itemExists) {
      itemExists.quantity += quantity;
      await itemExists.save();
    } else {
      const newCartItem = await CartItem.create({
        cartId: cart._id,
        product: productId,
        quantity: quantity || 1,
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

    console.log(quantity);

    if (
      quantity === "" ||
      quantity === undefined ||
      quantity === null ||
      quantity < 0
    ) {
      throw customError(400, "Valid quantity is required");
    }

    if (quantity === 0) {
      const cartItem = await CartItem.findOne({ _id: cartItemId });

      if (!cartItem) {
        throw customError(404, "Cart item not found");
      }

      const cartId = cartItem.cartId;

      await CartItem.deleteOne({ _id: cartItemId });
      await Cart.updateOne({ _id: cartId }, { $pull: { items: cartItemId } });
      return res.status(200).send({ message: "Cart item deleted" });
    }

    const updatedCartItem = await CartItem.findOneAndUpdate(
      { _id: cartItemId },
      { $set: { quantity } },
      { new: true }
    );

    if (!updatedCartItem) {
      throw customError(404, "Cart item not found");
    }

    res.status(200).send(updatedCartItem);
  } catch (error) {
    next(error);
  }
};

module.exports = { getUserCart, addToCart, updateCartItem };
