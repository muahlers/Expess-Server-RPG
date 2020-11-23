const mongoose = require('mongoose');

// Extraigo la clase Schema de mongoose
const { Schema } = mongoose;

// Creo un esquema para User
const ChatSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
});

const ChatModel = mongoose.model('chat', ChatSchema);

module.exports = ChatModel;
