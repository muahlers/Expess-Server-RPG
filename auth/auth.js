const localStrategy = require('passport-local');
const JwtStrategy = require('passport-jwt');
const passport = require('passport');
const UserModel = require('../models/userModel');

// handler user registration
passport.use('signup', new localStrategy.Strategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true,
}, async (request, email, password, done) => {
  try {
    const { username } = request.body;
    const user = await UserModel.create({ email, password, username });
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// handler user login
passport.use('login', new localStrategy.Strategy({
  usernameField: 'email',
  passwordField: 'password',
}, async (email, password, done) => {
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return done(new Error('user not found'), false);
    }
    // Metodo de la clases User Scheme
    const valid = await user.isValidPassword(password);
    if (!valid) {
      return done(new Error('password incorrect'), false);
    }
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// verify JWT token
passport.use('jwt', new JwtStrategy.Strategy({
  secretOrKey: process.env.JWT_SECRET,
  jwtFromRequest: (request) => {
    let token = null;
    if (request && request.cookies) token = request.cookies.jwt;
    return token;
  },
}, async (token, done) => {
  try {
    return done(null, token.user);
  } catch (error) {
    return done(error);
  }
}));
