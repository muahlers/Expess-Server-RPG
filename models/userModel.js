const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Extraigo la clase Schema de mongoose
const { Schema } = mongoose;

// Creo un esquema para User
const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  resetToken: {
    type: String,
  },
  resetTokenExp: {
    type: Date,
  },
});

// Encrypt Password
UserSchema.pre('save', async function (next) {
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
  next();
});

// Compare Encrypt passwordRoutes

UserSchema.methods.isValidPassword = async function (password) {
  const user = this;
  const compare = await bcrypt.compare(password, user.password);
  return compare;
};

const UserModel = mongoose.model('user', UserSchema);

module.exports = UserModel;
