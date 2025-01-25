const Orders = require("../models/orderModel");
const Cart = require("../models/cartModel");
const CartItems = require("../models/cartItemModel");
const OrderItems = require("../models/orderItemModel");
const Products = require("../models/productModel");
const Payments = require("../models/paymentModel");
const customError = require("../utils/customError");
const { default: mongoose } = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const createOrder = async (req, res, next) => {
  const webhookEndpointSecret = process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET;
  const sig = req.headers["stripe-signature"];

  const event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    webhookEndpointSecret
  );

  const data = JSON.parse(event?.data?.object?.metadata.data);

  if (event.type === "payment_intent.succeeded") {
    // Always respond with 200 to acknowledge receipt
    res.status(200).send("Success");
    // console.log("Payment Intent succeeded:", event.data.object);

    const MAX_RETIES = 4;
    let attempt = 0;

    while (attempt < MAX_RETIES) {
      // start session
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // get the cart data
        // get the user data with email
        const cart = await Cart.findOne({ _id: data.cartId }).session(session);

        const cartItems = await CartItems.find({ cartId: cart?._id })
          .populate("product")
          .session(session);

        // process data to filter out the stocked out items

        const stockedItems = cartItems?.filter(
          (item) => item.product.stock >= item.quantity
        );

        // calculate the total price and quantity of those remaining items.
        const totalPrice = stockedItems.reduce(
          (acc, item) => acc + item.product.price * item.quantity,
          0
        );

        // create new object of order then save it to database.
        const orderData = {
          user: {
            userId: cart?.user,
            name: data?.userName,
            email: data?.userEmail,
          },
          address: data?.address,
          totalPrice: totalPrice,
        };

        const newOrder = await Orders.create([orderData], { session });

        // save order items to db
        const orderItems = stockedItems.map((item) => {
          return {
            orderId: newOrder?.at(0)._id,
            product: item.product._id,
            price: item.product.price,
            quantity: item.quantity,
            subtotal: item.product.price * item.quantity,
          };
        });

        await OrderItems.insertMany(orderItems, { session });

        // create a payment object and save it to database

        const newPaymentData = {
          orderId: newOrder?.at(0)._id,
          user: cart.user,
          amount: totalPrice,
          transactionId: event.data.object.id,
        };
        await Payments.create([newPaymentData], { session });

        // delete the cart and cart items from database
        await Cart.findByIdAndDelete({ _id: data.cartId }, { session });
        await CartItems.deleteMany({ cartId: cart._id }, { session });

        // bulkwrite to update the product stock after placing order
        const bulkOps = stockedItems.map((item) => {
          return {
            updateOne: {
              filter: { _id: item.product._id },
              update: { $inc: { stock: -item.quantity } },
            },
          };
        });
        await Products.bulkWrite(bulkOps, { session });

        // send a order placing email to the user in invoice format

        // commiting session
        await session.commitTransaction();
        return;
      } catch {
        attempt += 1;
        // aborting session in case of failure
        await session.abortTransaction();

        if (attempt >= MAX_RETIES) {
          return;
        }
      } finally {
        session.endSession();
      }
    }
  }
};

const getOrders = async (query) => {
  try {
    return await Orders.find(query);
  } catch (error) {
    throw error;
  }
};

const getUsersOrders = async (req, res, next) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      throw customError(400, "User id is required");
    }

    const allOrders = await getOrders({ "user.userId": userId });

    res.status(200).send(allOrders);
  } catch (error) {
    next(error);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const orders = await getOrders({});

    res.status(200).send(orders);
  } catch (error) {
    next(error);
  }
};

const getSingleOrder = async (req, res, next) => {
  try {
    const id = req.params.orderId;

    if (!id) {
      throw customError(400, "Order id is required");
    }

    const order = await Orders.findOne({ _id: id }).lean();

    if (!order) {
      throw customError(404, "Order not found");
    }
    const orderItems = await OrderItems.find({ orderId: id }).populate(
      "product"
    );
    const paymentDetails = await Payments.findOne({ orderId: id });

    const response = {
      ...order,
      items: orderItems,
      paymentDetails,
    };

    res.status(200).send(response);
  } catch (error) {
    next(error);
  }
};

const updateOrder = async (req, res, next) => {
  try {
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  updateOrder,
  getUsersOrders,
  getAllOrders,
  getSingleOrder,
};
