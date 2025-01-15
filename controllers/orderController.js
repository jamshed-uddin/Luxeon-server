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
  console.log("req body", req.body);
  console.log("signature", sig, webhookEndpointSecret);

  const event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    webhookEndpointSecret
  );
  // console.log("webhook reveived", event);
  const data = JSON.parse(event?.data?.object?.metadata.data);

  // console.log(data);

  if (event.type === "payment_intent.succeeded") {
    console.log("Payment Intent succeeded:", event.data.object);

    const MAX_RETIES = 3;
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

        const stockedItems = cartItems.filter(
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
            name: data?.userName,
            email: data?.userEmail,
          },
          address: data?.address,
          totalPrice: totalPrice,
        };

        const newOrder = await Orders.create(orderData, { session });

        // save order items to db
        const orderItems = stockedItems.map((item) => {
          return {
            orderId: newOrder._id,
            product: item.product._id,
            price: item.product.price,
            quantity: item.quantity,
            subtotal: item.product.price * item.quantity,
          };
        });

        await OrderItems.insertMany(orderItems, { session });

        // create a payment object and save it to database

        const newPaymentData = {
          orderId: newOrder._id,
          user: cart.user,
          amount: totalPrice,
          transactionId: event.data.object.id,
        };
        await Payments.create(newPaymentData, { session });

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
        // console.log("new order", newOrder);
        // console.log("new order items", orderItems);
        // console.log("new payment data", newPaymentData);
        // console.log("the stripe event", event);
        // send a order placing email to the user in invoice format

        // commiting session
        await session.commitTransaction();
        return;
      } catch (error) {
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

  // Always respond with 200 to acknowledge receipt
  res.status(200).send("Success");
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
};
