const config = {
    dbUrl: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/atiq",
    port: process.env.PORT || 4000,
    jwtSecret: process.env.JWT_SECRET || "ABC123",
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || "XYZ456",
    encryptionKey: process.env.ENCRYPTION_KEY || "SECRET_KEY"
};
  
module.exports = { config }