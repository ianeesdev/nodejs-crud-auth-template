const express = require("express");
const router = express.Router();
const crypto = require("crypto");

const upload = require("../../../config/multer.config");
const { protect, admin } = require("../../../middleware/auth.middleware");
const {
  encrypt,
  decrypt,
  getPublicKey,
} = require("../../../middleware/encryption.middleware");

const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getUser,
  verifyOTP,
  updateUserProfile,
  getAllUsers,
  deleteUser,
  refreshToken,
} = require("../controllers/user.controller");

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.post("/forgotPassword", forgotPassword);
router.post("/verifyOTP", protect, verifyOTP);
router.post("/resetPassword", protect, resetPassword);
router.get("/getUser", protect, getUser);
router.put(
  "/updateProfile",
  protect,
  upload.single("avatar"),
  updateUserProfile
);
router.post("/refreshToken", refreshToken);

// Admin routes
router.get("/users", protect, admin, getAllUsers);
router.delete("/users/:id", protect, admin, deleteUser);

router.get("/public-key", getPublicKey);

// Test endpoints
router.post("/encrypt-test", (req, res) => {
  try {
    const publicKey = process.env.PUBLIC_KEY;
    if (!publicKey) {
      return res.status(500).json({ message: "Public key is not configured" });
    }

    const aesKey = crypto.randomBytes(32);

    // Encrypt data using AES
    const { iv, encryptedData } = encrypt(aesKey, req.body);

    // Encrypt AES key using RSA public key
    const encryptedAesKey = crypto.publicEncrypt(
      { key: publicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
      aesKey
    );

    res.json({
      encryptedKey: encryptedAesKey.toString("base64"),
      payload: { iv, encryptedData },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Encryption failed", error: error.message });
  }
});

router.post("/decrypt-test", (req, res) => {
  try {
    if (!req.body.encryptedKey || !req.body.payload) {
      return res
        .status(400)
        .json({ message: "Encrypted key and data required" });
    }

    const encryptedAesKey = Buffer.from(req.body.encryptedKey, "base64");
    const { iv, encryptedData } = req.body.payload;

    // Decrypt AES key using private RSA key
    const aesKey = crypto.privateDecrypt(
      {
        key: process.env.PRIVATE_KEY,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      encryptedAesKey
    );

    // Decrypt the data using AES key
    const decryptedPayload = decrypt(aesKey, iv, encryptedData);

    res.json({ decryptedData: decryptedPayload });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Decryption failed", error: error.message });
  }
});

module.exports = router;
