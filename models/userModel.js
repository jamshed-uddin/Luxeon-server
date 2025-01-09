const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const userSchema = mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"] },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "The email address must be unique"],
    },
    password: { type: String, required: [true, "Password is required"] },
    role: { type: String, default: "customer" },
    address: [
      {
        name: { type: String, default: "" },
        phoneNumber: { type: Number },
        country: { type: String, default: "" },
        city: { type: String, default: "" },
        zipCode: { type: String, default: "" },
        addressLine: { type: String, default: "" },
        isDefault: { type: Boolean },
      },
    ],
    provider: { type: String, enum: ["credentials", "google"] },
    passwordResetToken: { type: String },
    passwordResetTokenExpires: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generatePasswordResetToken = async function () {
  const token = crypto.randomBytes(20).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  this.passwordResetTokenExpires = Date.now() + 15 * 60 * 1000;

  return token;
};

module.exports = mongoose.models?.User || mongoose.model("User", userSchema);
