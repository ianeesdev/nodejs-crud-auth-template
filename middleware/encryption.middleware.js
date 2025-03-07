const crypto = require('crypto');
const { config } = require('../config/settings');

// Generate RSA keys once
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

const algorithm = 'aes-256-cbc';

const encrypt = (aesKey, data) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, aesKey, iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { iv: iv.toString('hex'), encryptedData: encrypted };
};

const decrypt = (aesKey, ivHex, encryptedData) => {
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, aesKey, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
};

const encryptionMiddleware = (req, res, next) => {
  const noEncryptionEndpoints = ['/api/auth/login', '/api/auth/signup', '/api/auth/public-key', '/api/auth/encrypt-test', '/api/auth/decrypt-test'];
  
  if (noEncryptionEndpoints.includes(req.path)) {
    return next();
  }

  // Enforce encryption for other endpoints
  if (!req.body.encryptedKey || !req.body.encryptedData) {
    return res.status(400).json({ message: 'Encrypted key and data required' });
  }

  try {
    // Decrypt AES key with RSA private key
    const encryptedAesKey = Buffer.from(req.body.encryptedKey, 'base64');
    const aesKey = crypto.privateDecrypt(
      { key: privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
      encryptedAesKey
    );

    // Decrypt data with AES key
    const { iv, encryptedData } = req.body.encryptedData;
    req.body = decrypt(aesKey, iv, encryptedData);
    
    // Attach AES key to request for response encryption
    req.aesKey = aesKey;
    next();
  } catch (error) {
    return res.status(400).json({ message: 'Decryption failed', error: error.message });
  }
};

const responseEncryptionMiddleware = (req, res, next) => {
  const originalSend = res.send;
  const noEncryptionEndpoints = ['/api/auth/public-key'];

  res.send = function (data) {
    if (noEncryptionEndpoints.includes(req.path)) {
      return originalSend.call(this, data);
    }

    if (req.aesKey && typeof data === 'object') {
      const { iv, encryptedData } = encrypt(req.aesKey, data);
      originalSend.call(this, { iv, encryptedData });
    } else {
      originalSend.call(this, data);
    }
  };
  next();
};

module.exports = { 
  encryptionMiddleware, 
  responseEncryptionMiddleware,
  encrypt,
  decrypt,
  getPublicKey: (req, res) => res.json({ publicKey })
};