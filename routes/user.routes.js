const express = require("express");
const router = express.Router();
const crypto = require("crypto");

const upload = require("../config/multer.config");
const { protect, admin } = require("../middleware/auth.middleware");
const { encrypt, decrypt, getPublicKey } = require("../middleware/encryption.middleware");

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
router.put("/updateProfile", protect, upload.single("avatar"), updateUserProfile);
router.post("/refreshToken", refreshToken);

// Admin routes
router.get("/users", protect, admin, getAllUsers);
router.delete("/users/:id", protect, admin, deleteUser);


router.get("/public-key", getPublicKey);

// Test endpoints
router.post("/encrypt-test", (req, res) => {
  const { data } = req.body;
  const aesKey = crypto.randomBytes(32); // Generate AES key
  const encrypted = encrypt(aesKey, data); // Encrypt data
  res.json({
    iv: encrypted.iv,
    encryptedData: encrypted.encryptedData,
    aesKey: aesKey.toString('base64') // Return AES key in base64
  });
});

router.post("/decrypt-test", (req, res) => {
  const { iv, encryptedData } = req.body;
  const aesKey = Buffer.from(req.headers['aes-key'], 'base64'); // Get AES key from header
  try {
    const decrypted = decrypt(aesKey, iv, encryptedData);
    res.json({ decrypted });
  } catch (error) {
    res.status(400).json({ error: "Decryption failed" });
  }
});

module.exports = router;