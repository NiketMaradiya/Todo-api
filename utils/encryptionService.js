const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

const getEncryptionKey = () => {
  const rawKey =
    process.env.CONFIG_ENCRYPTION_KEY;

  if (!rawKey) {
    throw new Error(
      "CONFIG_ENCRYPTION_KEY is not configured"
    );
  }

  const value =
    rawKey.trim();

  // 64 hexadecimal characters = 32 bytes
  if (
    /^[0-9a-fA-F]{64}$/.test(value)
  ) {
    return Buffer.from(
      value,
      "hex"
    );
  }

  // Base64 / Base64URL support
  try {
    const normalized =
      value
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const padded =
      normalized.padEnd(
        Math.ceil(
          normalized.length / 4
        ) * 4,
        "="
      );

    const decoded =
      Buffer.from(
        padded,
        "base64"
      );

    if (
      decoded.length === 32
    ) {
      return decoded;
    }
  } catch (error) {
    // handled below
  }

  throw new Error(
    "CONFIG_ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters or valid base64)"
  );
};

const validateEncryptionKey = () => {
  getEncryptionKey();

  return true;
};

const encrypt = (
  plainText
) => {
  if (
    plainText === undefined ||
    plainText === null
  ) {
    throw new Error(
      "Value to encrypt is required"
    );
  }

  const iv =
    crypto.randomBytes(
      IV_LENGTH
    );

  const cipher =
    crypto.createCipheriv(
      ALGORITHM,
      getEncryptionKey(),
      iv
    );

  const encrypted =
    Buffer.concat([
      cipher.update(
        String(plainText),
        "utf8"
      ),
      cipher.final(),
    ]);

  const authTag =
    cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
};

const decrypt = (
  encryptedValue
) => {
  if (
    !encryptedValue ||
    typeof encryptedValue !==
      "string"
  ) {
    throw new Error(
      "Encrypted value is required"
    );
  }

  const parts =
    encryptedValue.split(":");

  if (
    parts.length !== 3
  ) {
    throw new Error(
      "Invalid encrypted value format"
    );
  }

  const [
    ivBase64,
    authTagBase64,
    encryptedBase64,
  ] = parts;

  const iv =
    Buffer.from(
      ivBase64,
      "base64"
    );

  const authTag =
    Buffer.from(
      authTagBase64,
      "base64"
    );

  const encrypted =
    Buffer.from(
      encryptedBase64,
      "base64"
    );

  if (
    iv.length !==
    IV_LENGTH
  ) {
    throw new Error(
      "Invalid encrypted value IV"
    );
  }

  if (
    authTag.length !==
    AUTH_TAG_LENGTH
  ) {
    throw new Error(
      "Invalid encrypted value authentication tag"
    );
  }

  const decipher =
    crypto.createDecipheriv(
      ALGORITHM,
      getEncryptionKey(),
      iv
    );

  decipher.setAuthTag(
    authTag
  );

  const decrypted =
    Buffer.concat([
      decipher.update(
        encrypted
      ),
      decipher.final(),
    ]);

  return decrypted.toString(
    "utf8"
  );
};

module.exports = {
  encrypt,
  decrypt,
  validateEncryptionKey,
};