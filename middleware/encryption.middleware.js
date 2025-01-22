const crypto = require('crypto');
const { config } = require('../config/settings');

const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(config.encryptionKey, 'salt', 32);
const iv = Buffer.alloc(16, 0); // Initialization vector

const encrypt = (text) => {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const decrypt = (text) => {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(text, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

const encryptionMiddleware = (req, res, next) => {
  const noEncryptionEndpoints = ['/api/auth/login', '/api/auth/signup'];
  if (noEncryptionEndpoints.includes(req.path)) {
    return next();
  }

  if (req.body && req.body.encrypted) {
    try {
      const decrypted = decrypt(req.body.encrypted);
      req.body = JSON.parse(decrypted);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid encrypted data' });
    }
  }
  next();
};

const responseEncryptionMiddleware = (req, res, next) => {
  const originalSend = res.send;
  res.send = function (data) {
    if (typeof data === 'object') {
      const encrypted = encrypt(JSON.stringify(data));
      originalSend.call(this, { encrypted });
    } else {
      originalSend.call(this, data);
    }
  };
  next();
};

module.exports = { encryptionMiddleware, responseEncryptionMiddleware };