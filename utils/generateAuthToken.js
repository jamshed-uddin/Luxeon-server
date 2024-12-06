const jwt = require("jsonwebtoken");

const generateAuthToken = (payload) => {
  const token = jwt.sign(payload, process.env.SECRET, {
    expiresIn: "30d",
  });

  return token;
};

module.exports = generateAuthToken;
