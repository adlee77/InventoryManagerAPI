const bcrypt = require('bcryptjs');

const plaintextPassword = 'password';

bcrypt.hash(plaintextPassword, 10, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
  } else {
    console.log('Hashed password:', hash);
  }
});
