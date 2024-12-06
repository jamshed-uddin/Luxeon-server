const CartItem = require("../models/cartItemModel");
const Cart = require("../models/cartModel");
const customError = require("../utils/customError");
const { setCookie, getCookie } = require("../utils/handleCookies");

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
//route GET/api/cart?userId= (anonymous cart id)
//access public

const getUserCart = async (req, res, next) => {
  try {
    const userId = req.query.userId;
    const cartId = getCookie(req, "cartId");

    const cart = await getCart(userId, cartId, true);

    // if (!cart) {
    //   throw customError(404, "Cart not found!");
    // }

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
      const newCartItem = await CartItem.create({
        cartId: cart._id,
        product: productId,
        quantity: quantity || 1,
      });

      cart = await Cart.updateOne(
        { _id: cart?._id },
        { $push: { items: newCartItem._id } }
      );
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

  const localCartId = getCookie(req, "cartId");

  const localCart = localCartId
    ? await Cart.findOne({ _id: localCartId }).populate("items")
    : null;

  if (!localCart) return;

  let userCart = await Cart.findOne({ user: userId }).populate("items");

  try {
    if (userCart) {
      localCart?.items.forEach(async (localCartItem) => {
        const existingUserItem = userCart?.items.find(
          (userCartItem) =>
            userCartItem.product.toString() === localCartItem.product.toString()
        );

        if (existingUserItem) {
          // todo: update of the quantity of the cart item in user cart
          await CartItem.findOneAndUpdate(
            { cartId: userCart._id, product: existingUserItem?.product },
            {
              $inc: { quantity: localCartItem?.quantity },
            }
          );

          // todo : delete the item from local cart
          await CartItem.deleteOne({
            cartId: localCartId,
            product: existingUserItem?.product,
          });
        } else {
          // todo : replace cartid of local cart item with user cart id

          localCartItem.cartId = userCart?._id;
          await localCartItem.save();
        }
      });
      // todo : after the loop delete the local cart .

      await Cart.deleteOne({ _id: localCartId });
    } else {
      await Cart.updateOne({ _id: localCartId }, { user: userId });
    }
  } catch (error) {
    next(error);
  }
};

function mergeCartItems(userCartId, ...cartItems) {
  return cartItems.reduce((acc, items) => {
    items.forEach((item) => {
      const existingItem = acc.find(
        (i) => i.product.toString() === item.product.toString()
      );

      if (existingItem) {
        existingItem.cartId = userCartId;
        existingItem.quantity += item.quantity;
      } else {
        acc.push({ ...item, cartId: userCartId });
      }
    });

    return acc;
  }, []);
}

module.exports = { getUserCart, addToCart, updateCartItem };

// fffffffffff

// import { Cart } from "./models/Cart"; // Assuming you have Cart and CartItem models
// import { CartItem } from "./models/CartItem"; // Replace with actual import paths as needed
// import { cookies } from "some-cookie-library"; // Replace with your cookie handling library

// export async function mergeAnonymousCartIntoUserCart(userId) {
//   const localCartId = cookies().get("localCartId")?.value;

//   // Fetch the local (anonymous) cart
//   const localCart = localCartId
//     ? await Cart.findOne({ _id: localCartId }).populate("items")
//     : null;

//   if (!localCart) return;

//   // Fetch the user's cart
//   let userCart = await Cart.findOne({ userId }).populate("items");

//   // Use Mongoose transactions for safety
//   const session = await Cart.startSession();
//   session.startTransaction();

//   try {
//     if (userCart) {
//       // Merge the cart items
//       const mergedCartItems = mergeCartItems(localCart.items, userCart.items);

//       // Clear existing user cart items
//       await CartItem.deleteMany({ cartId: userCart._id }).session(session);

//       // Update the user cart with merged items
//       const newCartItems = mergedCartItems.map((item) => ({
//         productId: item.productId,
//         quantity: item.quantity,
//         cartId: userCart._id, // Ensure items have correct user cartId
//       }));

//       await CartItem.insertMany(newCartItems, { session });
//     } else {
//       // Create a new user cart with local cart's items
//       userCart = await Cart.create([{ userId }], { session });

//       const newCartItems = localCart.items.map((item) => ({
//         productId: item.productId,
//         quantity: item.quantity,
//         cartId: userCart._id, // Ensure new cart items are linked to the new cart
//       }));

//       await CartItem.insertMany(newCartItems, { session });
//     }

//     // Delete the local (anonymous) cart
//     await Cart.deleteOne({ _id: localCart._id }).session(session);

//     // Clear the localCartId cookie
//     cookies().set("localCartId", "");

//     // Commit the transaction
//     await session.commitTransaction();
//   } catch (error) {
//     // Rollback the transaction on error
//     await session.abortTransaction();
//     throw error;
//   } finally {
//     session.endSession();
//   }
// }

// function mergeCartItems(...cartItems) {
//   return cartItems.reduce((acc, items) => {
//     items.forEach((item) => {
//       const existingItem = acc.find(
//         (i) => i.productId.toString() === item.productId.toString()
//       );
//       if (existingItem) {
//         existingItem.quantity += item.quantity;
//       } else {
//         acc.push({
//           productId: item.productId,
//           quantity: item.quantity,
//           cartId: item.cartId, // Retain cartId for clarity but this will be updated during insertion
//         });
//       }
//     });
//     return acc;
//   }, []);
// }
