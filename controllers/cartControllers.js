const { default: mongoose } = require("mongoose");
const CartItem = require("../models/cartItemModel");
const Cart = require("../models/cartModel");
const customError = require("../utils/customError");
const {
  setCookie,
  getCookie,
  deleteCookie,
} = require("../utils/handleCookies");

const createCart = async (res, userId) => {
  try {
    let newCart;
    if (userId) {
      newCart = await Cart.create({ user: userId, items: [] });
    } else {
      newCart = await Cart.create({ items: [] });
      setCookie(res, "cartId", newCart._id);
    }

    return newCart;
  } catch (error) {
    throw new Error(error);
  }
};

const getCart = async (userId, cartId, shouldPopulate = false) => {
  if (!userId && !cartId) return;
  try {
    let filter = {};
    if (userId) {
      filter.user = userId;
    }

    if (cartId) {
      filter._id = cartId;
    }
    console.log(filter);
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
//route GET/api/cart?userId= (anonymous cart id)
//access public

const getUserCart = async (req, res, next) => {
  try {
    const userId = req.query.userId;
    const cartId = getCookie(req, "cartId");
    console.log("anonymous cart", cartId);

    const cart = await getCart(userId, cartId, true);
    console.log(cart);

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
    const { productId, quantity, userId } = req.body;
    const cartId = getCookie(req, "cartId");

    if (!productId || !quantity || quantity < 1) {
      throw customError(400, "Product id and valid quantity is required");
    }

    let cart =
      (await getCart(userId, cartId)) || (await createCart(res, userId));

    let itemExists = await CartItem.findOne({
      product: productId,
      _id: { $in: cart.items },
    });

    if (itemExists) {
      itemExists.quantity += quantity;
      await itemExists.save();
    } else {
      await CartItem.create({
        cartId: cart._id,
        product: productId,
        quantity: quantity || 1,
      });

      // cart = await Cart.updateOne(
      //   { _id: cart?._id },
      //   { $push: { items: newCartItem._id } }
      // );
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

const mergeAnonymousCart = async (req, res, next) => {
  const { userId } = req.body;
  console.log("the user id", userId);

  const localCartId = getCookie(req, "cartId");
  console.log(localCartId);

  const localCart = localCartId
    ? await Cart.findOne({ _id: localCartId }).populate("items")
    : null;

  // there is no local cart. So there is nothing to merge.
  if (!localCart) {
    return res.status(200).send("Cart merged successfully");
  }

  let userCart = await Cart.findOne({ user: userId });

  // const session = await mongoose.startSession();
  // session.startTransaction();
  console.log("localcart", localCart);
  console.log("usercart", userCart);
  try {
    // at this point we have both local cart and user cart
    if (userCart) {
      const bulkOps = [];

      // looping through the local cart items
      localCart?.items.forEach((localCartItem) => {
        // and checking if the item is already in the user cart.
        const existingUserItem = userCart?.items.find(
          (userCartItem) =>
            userCartItem.product.toString() === localCartItem.product.toString()
        );

        // if the item is already in the user cart then we just add the local cart item quantity to the user cart item quantity.
        if (existingUserItem) {
          bulkOps.push({
            updateOne: {
              filter: {
                cartId: userCart._id,
                product: existingUserItem?.product,
              },
              update: {
                $inc: { quantity: localCartItem?.quantity },
              },
            },
          });

          // then we delete the item of the local cart as we update the quantity of the matched usercart item.
          bulkOps.push({
            deleteOne: {
              filter: {
                cartId: localCartId,
                product: existingUserItem?.product,
              },
            },
          });
        } else {
          // if the item is not in the user cart then we just update the cart id of the local cart item to the user cart id
          bulkOps.push({
            updateOne: {
              filter: {
                _id: localCartItem._id,
              },
              update: {
                cartId: userCart._id,
              },
            },
          });
        }
      });

      // todo: do the bulkwrite here
      // await CartItem.bulkWrite(bulkOps, { session });
      console.log(bulkOps);

      // after loop is complete items either merged or updated. Now we can delete the local cart
      await Cart.deleteOne({ _id: localCartId }, { session });
      // deleteCookie(res, "cartId");
    } else {
      // if there is no user cart, then just update the cart with the user id
      await Cart.updateOne({ _id: localCartId }, { user: userId }, { session });
      // deleteCookie(res, "cartId");
    }

    // await session.commitTransaction();
    // session.endSession();

    res.status(200).send("Cart merged successfully");
  } catch (error) {
    // await session.abortTransaction();
    // session.endSession();
    next(error);
  }
};

module.exports = { getUserCart, addToCart, updateCartItem, mergeAnonymousCart };
