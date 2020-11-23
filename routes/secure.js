const express = require('express');

const ChatModel = require('../models/chatModel');
// Creo una instancia de express para manejar rutas llamada Router.
const router = express.Router();

router.post('/chat', async (request, response) => {
  if (!request.body || !request.body.message) {
    response.status(400).json({ message: 'invalid message', status: '400' });
  } else {
    const { email } = request.user; // const email = response.body.email.
    const { message } = request.body;
    const chat = await ChatModel.create({ email, message });
    response.status(200).json({ message: ' message sent!', status: '200' });
  }
});

module.exports = router;
