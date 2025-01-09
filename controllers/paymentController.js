const Payments = require("../models/paymentModel");
const customError = require("../utils/customError");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const createPaymentIntent = async (req, res, next) => {
  try {
    const { amount, data } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: {
        data: JSON.stringify(data),
      },
    });

    res.status(200).send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    next(error);
  }
};

module.exports = { createPaymentIntent };
