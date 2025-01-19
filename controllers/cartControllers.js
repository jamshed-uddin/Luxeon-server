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

const getCart = async (userId, cartId) => {
  if (!userId && !cartId) return null;
  try {
    let filter = {};
    if (userId) {
      filter.user = userId;
    }

    if (cartId && !userId) {
      filter._id = cartId;
    }

    let query = Cart.findOne(filter);

    const cart = await query.lean();
    const cartItems = await CartItem.find({ cartId: cart?._id }).populate(
      "product"
    );

    if (!cart) return null;

    return { ...cart, items: cartItems };
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

    const cart = await getCart(userId, cartId);
    if (!cart) {
      return res.status(200).send({ _id: null, user: null, items: [] });
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
    const { productId, quantity, userId } = req.body;
    const cartId = getCookie(req, "cartId");

    if (!productId || !quantity || quantity < 1) {
      throw customError(400, "Product id and valid quantity is required");
    }

    let cart =
      (await getCart(userId, cartId)) || (await createCart(res, userId));

    let itemExists = await CartItem.findOne({
      product: productId,
      cartId: cart._id,
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
      await CartItem.deleteOne({ _id: cartItemId });

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
  const localCartId = getCookie(req, "cartId");
  const localCart = localCartId ? await getCart("", localCartId) : null;

  // there is no local cart. So there is nothing to merge.
  if (!localCart) {
    return res.status(200).send({ message: "No anonymous cart to merge" });
  }

  const max_retries = 3;
  let attempt = 0;

  while (attempt < max_retries) {
    // starting mongoose transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let userCart = await getCart(userId, "");

      // at this point we have both local cart and user cart
      if (userCart) {
        const bulkOps = [];

        // looping through the local cart items
        localCart?.items.forEach((localCartItem) => {
          // and checking if the item is already in the user cart.
          const existingUserItem = userCart?.items.find(
            (userCartItem) =>
              userCartItem.product?._id.toString() ===
              localCartItem.product?._id.toString()
          );

          // if the item is already in the user cart then we just add the local cart item quantity to the user cart item quantity.
          if (existingUserItem) {
            bulkOps.push({
              updateOne: {
                filter: {
                  cartId: userCart._id,
                  product: existingUserItem?.product._id,
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
                  product: existingUserItem?.product._id,
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
        await CartItem.bulkWrite(bulkOps, { session });

        // after loop is complete items either merged or updated. Now we can delete the local cart
        await Cart.deleteOne({ _id: localCartId }, { session });
        deleteCookie(res, "cartId");
      } else {
        // if there is no user cart, then just update the cart with the user id
        await Cart.updateOne(
          { _id: localCartId },
          { user: userId },
          { session }
        );
        deleteCookie(res, "cartId");
      }

      // ending and commiting transaction
      await session.commitTransaction();
      session.endSession();

      // along with response this exits the loop
      return res.status(200).send({ message: "Cart merged successfully" });
    } catch (error) {
      // increasing the attempt
      attempt += 1;
      // aborting and ending transaction in case of failure
      await session.abortTransaction();
      session.endSession();
      // exits the loop
      if (attempt >= max_retries) {
        return next(error);
      }
    }
  }
};

module.exports = { getUserCart, addToCart, updateCartItem, mergeAnonymousCart };
