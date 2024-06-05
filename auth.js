const jwt = require('jsonwebtoken');

const authenticate = (event, context, callback) => {
  const token = event.headers.Authorization;

  if (!token) {
    return callback(null, {
      statusCode: 401,
      body: JSON.stringify({ message: 'Unauthorized' }),
    });
  }

  jwt.verify(token, 'your_secret_key', (err, decoded) => {
    if (err) {
      return callback(null, {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
      });
    }

    context.user = decoded;
    return callback(null, event);
  });
};

module.exports = authenticate;