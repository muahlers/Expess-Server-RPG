const express = require('express');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const path = require('path');
const crypto = require('crypto');

const UserModel = require('../models/userModel');

// Configuro Email Sender
const email = process.env.EMAIL_ACCOUNT;
const password = process.env.EMAIL_PASSWORD;

const stmpTransport = nodemailer.createTransport({
  service: process.env.EMAIL_PROVAIDER,
  auth: {
    user: email,
    pass: password,
  },
});

const handlebarsOptions = {
  viewEngine: {
    extName: '.hbs',
    defaultLayout: null,
    partialsDEMAIL_PROVAIDERir: './templates/',
    layoutsDir: './templates',
  },
  viewPath: path.resolve('./templates/'),
  extName: '.html',
};

stmpTransport.use('compile', hbs(handlebarsOptions));

// Creo una instancia de express para manejar rutas llamada Router.
const router = express.Router();

// End point forget Password
router.post('/forget-password', async (request, response, done) => {
  const userEmail = request.body.email;
  const user = await UserModel.findOne({ email: userEmail });

  if (!user) {
    response.status(400).json({ message: 'invalid email', status: '400' });
  }

  // Create & Update user reset token
  const buffer = crypto.randomBytes(20);
  const token = buffer.toString('hex');

  await UserModel.findByIdAndUpdate(
    { _id: user._id },
    {
      resetToken: token,
      resetTokenExp: Date.now() + 60000,
    },
  );

  if (!request.body || !request.body.email) {
    response.status(400).json({ message: 'invalid body', status: '400' });
  } else {
    try {
      // Send User a Email to reset password
      const emailOptions = {
        to: userEmail,
        from: email,
        template: 'forgot-password',
        subject: 'Game Reset Password',
        // Aqui pongo las variables que van dentro del email
        context: {
          name: 'joe',
          url: `http://localhost:${process.env.PORT || 3000}/reset-password.html?token=${token}`,
        },
      };
      await stmpTransport.sendMail(emailOptions);
      response.status(200).json({ message: 'An email has been sent to your email address, Password reset link is only valid for 10 min', status: '200' });
    } catch (error) {
      return done(error);
    }
  }
});

// End point reser Password
router.post('/reset-password', async (request, response, done) => {
  if (!request.body || !request.body.email || !request.body.password) {
    response.status(400).json({ message: 'invalid email Or Password', status: '400' });
  }
  const userEmail = request.body.email;

  const user = UserModel.findOne({
    resetToken: request.body.token,
    resetTokenExp: { $gt: Date.now() }, // gt: greater than
    email: userEmail,
  });

  if (!user) {
    response.status(400).json({ message: 'invalid token', status: '400' });
  }

  if (!request.body.password || !request.body.verifiedPassword || request.body.password !== request.body.verifiedPassword) {
    response.status(400).json({ message: 'Verified Password Not Match', status: '400' });
  }

  // update Database

  user.password = request.body.password;
  user.resetToken = undefined;
  user.resetTokenExp = undefined;
  // await user.save();

  try {
    // Send User a Email telling password updates
    const emailOptions = {
      to: userEmail,
      from: email,
      template: 'reset-password',
      subject: 'Game Updated Password',
      // Aqui pongo las variables que van dentro del email
      context: {
        name: user.username,
      },
    };
    await stmpTransport.sendMail(emailOptions);
    response.status(200).json({ message: 'password updated', status: '200' });
  } catch (error) {
    return done(error);
  }
});

module.exports = router;
