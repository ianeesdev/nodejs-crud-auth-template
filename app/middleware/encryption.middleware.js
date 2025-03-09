const crypto = require('crypto');

const algorithm = 'aes-256-cbc';

// Load environment variables
const publicKey = process.env.PUBLIC_KEY; // From public.pem
const encryptedPrivateKeyB64 = process.env.PRIVATE_KEY; // From private.b64
const keyPassword = process.env.KEY_PASSWORD;

// Decrypt private key
const decryptPrivateKey = () => {
  try {
    // 1. Decode base64
    const encryptedPrivateKey = Buffer.from(encryptedPrivateKeyB64, 'base64');
    
    // 2. Extract salt (first 8 bytes of encrypted data)
    const salt = encryptedPrivateKey.slice(8, 16);
    
    // 3. Derive key using PBKDF2 (matches openssl -pbkdf2)
    const key = crypto.pbkdf2Sync(
      keyPassword,
      salt,
      10000, // Iterations (same as OpenSSL default)
      32 + 16, // 32 bytes key + 16 bytes IV
      'sha256'
    );
    
    // 4. Split into AES key and IV
    const aesKey = key.slice(0, 32);
    const iv = key.slice(32, 48);
    
    // 5. Decrypt private key
    const decipher = crypto.createDecipheriv(algorithm, aesKey, iv);
    const decrypted = Buffer.concat([
      decipher.update(encryptedPrivateKey.slice(16)),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error('Private key decryption failed: ' + error.message);
  }
};

const privateKey = decryptPrivateKey();

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
  const noEncryptionEndpoints = ['/api/auth/signup', '/api/auth/public-key', '/api/auth/encrypt-test', '/api/auth/decrypt-test'];
  
  if (noEncryptionEndpoints.includes(req.path)) {
    return next();
  }

  // Enforce encryption for other endpoints
  if (!req.body.encryptedKey || !req.body.payload) {
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
    const { iv, encryptedData } = req.body.payload;
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

    if (req.aesKey) {
      try {
        const jsonData = typeof data === 'object' ? JSON.stringify(data) : JSON.stringify({ message: data });
        const { iv, encryptedData } = encrypt(req.aesKey, jsonData);
        return originalSend.call(this, JSON.stringify({ iv, encryptedData }));
      } catch (error) {
        console.error('Encryption error:', error);
      }
    }
    
    return originalSend.call(this, data);
  };

  next();
};

module.exports = { 
  encryptionMiddleware, 
  responseEncryptionMiddleware,
  encrypt,
  decrypt,
  getPublicKey: (req, res) => res.json({ publicKey }),
};