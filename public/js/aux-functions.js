function postData(url = '', data = {}) {
  return fetch(url, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'include', // need for cookies to pass
    headers: {
      'Content-Type': 'application/json',
    },
    redirect: 'follow',
    referrer: 'no-referer',
    body: JSON.stringify(data),
  }).then((response) => response.json());
}

function signIn() {
  const body = {
    // Sacos la info del la form del html
    email: document.forms[0].elements[0].value,
    password: document.forms[0].elements[1].value,
  };

  postData('login', body)
    .then((response) => {
      if (response.status !== '200') throw new Error(response.error);
      window.location.replace('/game.html');
    })
    .catch((error) => {
      window.alert(error.message);
      window.location.replace('/index.html');
    });
}

function signUp() {
  const body = {
    // Sacos la info del la form del html
    email: document.forms[0].elements[0].value,
    password: document.forms[0].elements[1].value,
    username: document.forms[0].elements[2].value,
  };
  postData('signup', body)
    .then((response) => {
      if (response.status !== '200') throw new Error(response.error);
      window.alert('account created!');
      window.location.replace('/index.html');
    })
    .catch((error) => {
      window.alert(error.message);
      window.location.replace('/signup.html');
    });
}

function forgotPassword() {
  const body = {
    // Sacos la info del la form del html
    email: document.forms[0].elements[0].value,
  };
  postData('forget-password', body)
    .then((response) => {
      if (response.status !== '200') throw new Error(response.error);
      window.alert('An email was sent to you email account.');
      window.location.replace('/index.html');
    })
    .catch((error) => {
      window.alert(error.message);
      window.location.replace('/forget-password.html');
    });
}

function resetPassword() {
  const password = document.forms[0].elements[1].value;
  const verifiedPassword = document.forms[0].elements[2].value;
  const body = {
    // Sacos la info del la form del html
    email: document.forms[0].elements[0].value,
    password: document.forms[0].elements[1].value,
    verifiedPassword: document.forms[0].elements[2].value,
    token: document.location.href.split('token=')[1],
  };

  if (password !== verifiedPassword) {
    window.alert("Passwords don't match");
  } else {
    postData('forget-password', body)
      .then((response) => {
        if (response.status !== '200') throw new Error(response.error);
        window.alert('Your password has been reset.');
        window.location.replace('/index.html');
      })
      .catch((error) => {
        window.alert(error.message);
        window.location.replace('/reset-password.html');
      });
  }
}
