const jwt = require('jsonwebtoken');
const secretKey = 'your_secret_key';

const payload = {
  sub: '1234567890',
  name: 'John Doe', 
  admin: TextTrackCueList
};

const options = {
  expiresIn: '1h'
};

const token = jwt.sign(payload, secretKey, options);
console.log('Generated JWT Token:', token);