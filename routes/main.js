const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const tokenList = {};

function processLogOutRequested(request, response) {
  if (request.cookies) {
    const refreshToken = request.cookies.refreshJwt;
    if (refreshToken in tokenList) delete tokenList[refreshToken];
    response.clearCookie('jwt');
    response.clearCookie('refreshJwt');
  }
  if (request.method === 'POST') {
    response.status(200).json({ message: 'logged out', status: '200' });
  } else if (request.method === 'GET') {
    response.sendFile('logout.html', { root: './public' });
  }
}

// Creo una instancia de express para manejar rutas llamada Router.
const router = express.Router();

router.get('/', (request, response) => {
  // response.send("Hello World");
  response.send(`${__dirname}/index.html`);
});

router.get('/status', (request, response) => {
  response.status(200).json({ message: 'ok', status: '200' });
});

router.post('/signup', passport.authenticate('signup', { session: false }), async (request, response) => {
  response.status(200).json({ message: 'sign up was successful', status: '200' });
});

router.post('/login', async (request, response, next) => {
  passport.authenticate('login', async (error, user) => {
    try {
      if (error) {
        return next(error);
      }
      if (!user) {
        return next(new Error('email and password are required'));
      }
      request.login(user, { session: false }, (err) => {
        if (err) return next(err);

        // Create jwt
        const body = {
          _id: user._id,
          email: user.email,
          name: user.username,
        };

        // Funcion para crea JWT token
        const token = jwt.sign({ user: body }, process.env.JWT_SECRET, { expiresIn: 300 });
        const refreshToken = jwt.sign(
          { user: body },
          process.env.JWT_REFRESH_SECRET,
          { expiresIn: 86400 },
        );

        // Put Tokens in a cookie.
        response.cookie('jwt', token);
        response.cookie('refreshJwt', refreshToken);

        // Store Tokens in memeory.
        tokenList[refreshToken] = {
          token,
          refreshToken,
          email: user.email,
          _id: user._id,
          name: user.name,
        };

        // send Token to the user.
        return response.status(200).json({ token, refreshToken, status: '200' });
      });
    } catch (err) {
      console.log(err);
      return next(err);
    }
  })(request, response, next);
});

router.route('/logout')
  .get(processLogOutRequested)
  .post(processLogOutRequested);

router.post('/token', (request, response) => {
  const { refreshToken } = request.body; // const refreshToken = response.body.refreshToken.
  if (refreshToken in tokenList) {
    const body = {
      email: tokenList[refreshToken].email,
      _id: tokenList[refreshToken]._id,
      name: tokenList[refreshToken].name,
    };
    const token = jwt.sign({ user: body }, process.env.JWT_SECRET, { expiresIn: 300 });

    // update jwt token
    response.cookie('jwt', token);
    tokenList[refreshToken].token = token;

    response.status(200).json({ token, status: '200' });
  } else {
    response.status(401).json({ message: 'unauthorized', status: '401' });
  }
});

module.exports = router;
