const Orders = require("../models/orderModel");
const Cart = require("../models/cartModel");
const OrderItems = require("../models/orderItemModel");
const customError = require("../utils/customError");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const createOrder = async (req, res, next) => {
  try {
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

    console.log(data);

    if (event.type === "payment_intent.created") {
      console.log("Payment Intent Created:", event.data.object);

      // get the cart data
      // get the user data with email
      const cart = await Cart.findOne({ _id: data.cartId }).populate({
        path: "items",
        populate: {
          path: "product",
        },
      });

      // process data to filter out the stocked out items

      const stockedItems = cart?.items.filter((item) => item.product.stock > 0);

      // calculate the total price and quantity of those remaining items.
      const totalPrice = stockedItems.reduce(
        (acc, item) => acc + item.product.price * item.quantity,
        0
      );

      // create new object of order then save it to database.
      const newOrder = {
        user: {
          name: data.userName,
          email: data.userEmail,
        },
        address: data.address,
        totalPrice: totalPrice,
        items: stockedItems.map((item) => item._id),
      };

      const orderItems = stockedItems.map((item) => {
        return {
          orderId: newOrder._id,
          product: item.product._id,
          price: item.product.price,
          quantity: item.quantity,
          subtotal: item.product.price * item.quantity,
        };
      });

      // create a payment object and save it to database

      const newPaymentData = {
        orderId: newOrder._id,
        user: cart.user,
        amount: totalPrice,
        transactionId: event.data.object.id,
      };

      // delete the cart and cart items from database
      // await Cart.findByIdAndDelete(data.cartId);

      console.log("new order", newOrder);
      console.log("new order items", orderItems);
      console.log("new payment data", newPaymentData);
      console.log("the stripe event", event);
      // send a order placing email to the user in invoice format
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).send("Webhook received");
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
};
