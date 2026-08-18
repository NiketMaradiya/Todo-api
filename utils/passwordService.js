const crypto = require("crypto");

// ==========================================
// Generate Temporary Random Password
// ==========================================

const generateTemporaryPassword = () => {
  const randomPart =
    crypto
      .randomBytes(8)
      .toString("hex");

  return `Temp@${randomPart}`;
};

module.exports = {
  generateTemporaryPassword,
};