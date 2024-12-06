const jwt = require("jsonwebtoken");
const secret = process.env.SECRET;

const setCookie = (res, key, value) => {
  const encryptedValue = jwt.sign({ [key]: value }, secret, {
    expiresIn: "30d",
  });

  res.cookie(key, encryptedValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

const deleteCookie = (res, key) => {
  res.cookie(key, "", {
    httpOnly: true,
    expires: new Date(0),
  });
};

const getCookie = (req, key) => {
  const encryptedValue = req.cookies[key];

  if (!encryptedValue) return null;

  try {
    const decoded = jwt.verify(encryptedValue, secret);
    // console.log("cartId", decoded[key]);
    return decoded[key];
  } catch (error) {
    return null;
  }
};

module.exports = { setCookie, deleteCookie, getCookie };
