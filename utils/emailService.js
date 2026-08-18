const nodemailer =
  require("nodemailer");

// ==========================================
// Create Email Transporter
// ==========================================

const transporter =
  nodemailer.createTransport({
    host:
      process.env.EMAIL_HOST ||
      "smtp.gmail.com",

    port:
      Number(
        process.env.EMAIL_PORT
      ) || 587,

    secure:
      process.env.EMAIL_SECURE ===
      "true",

    auth: {
      user:
        process.env.EMAIL_USER,

      pass:
        process.env.EMAIL_PASSWORD,
    },

    tls: {
      rejectUnauthorized:
        true,
    },
  });

// ==========================================
// Verify Email Connection
//
// Called manually from server/tests if needed.
// ==========================================

const verifyEmailConnection =
  async () => {

    if (
      !process.env.EMAIL_USER
    ) {
      throw new Error(
        "EMAIL_USER is missing in .env"
      );
    }

    if (
      !process.env.EMAIL_PASSWORD
    ) {
      throw new Error(
        "EMAIL_PASSWORD is missing in .env"
      );
    }

    try {

      await transporter.verify();

      console.log(
        "Email SMTP connection successful"
      );

      console.log(
        `Email sender: ${process.env.EMAIL_USER}`
      );

      return true;

    } catch (
      error
    ) {

      console.error(
        "EMAIL SMTP CONNECTION ERROR:"
      );

      console.error(
        error.message
      );

      throw error;
    }
  };

// ==========================================
// Send Email
// ==========================================

const sendEmail =
  async ({
    to,
    subject,
    html,
    text,
  }) => {

    if (
      !process.env.EMAIL_USER
    ) {
      throw new Error(
        "EMAIL_USER is missing in .env"
      );
    }

    if (
      !process.env.EMAIL_PASSWORD
    ) {
      throw new Error(
        "EMAIL_PASSWORD is missing in .env"
      );
    }

    if (!to) {
      throw new Error(
        "Recipient email is required"
      );
    }

    return transporter.sendMail({
      from:
        process.env.EMAIL_FROM ||
        process.env.EMAIL_USER,

      to,

      subject,

      text,

      html,
    });
  };

// ==========================================
// Send New User Temporary Password Email
// ==========================================

const sendWelcomePasswordEmail =
  async ({
    name,
    email,
    temporaryPassword,
  }) => {

    return sendEmail({

      to:
        email,

      subject:
        "Welcome - Your Temporary Password",

      text: `
Hello ${name},

Your account has been created successfully.

Email:
${email}

Temporary Password:
${temporaryPassword}

Please login using this temporary password.

IMPORTANT:
You must change your password after your first login.

If you did not request this account,
please contact the administrator.
      `,

      html: `
        <div
          style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
          "
        >

          <h2>
            Welcome, ${name}
          </h2>

          <p>
            Your account has been created successfully.
          </p>

          <p>
            <strong>Email:</strong>
            ${email}
          </p>

          <p>
            <strong>Temporary Password:</strong>
          </p>

          <div
            style="
              padding: 15px;
              background: #f4f4f4;
              border-radius: 5px;
              font-size: 18px;
            "
          >
            <strong>
              ${temporaryPassword}
            </strong>
          </div>

          <p>
            Please login using this temporary password.
          </p>

          <p style="color: red;">
            <strong>
              You must change your password
              after your first login.
            </strong>
          </p>

          <p>
            If you did not request this account,
            please contact the administrator.
          </p>

        </div>
      `,
    });
  };

// ==========================================
// Send Login Notification Email
// ==========================================

const sendLoginNotificationEmail =
  async ({
    name,
    email,
    loginTime,
    ipAddress,
  }) => {

    return sendEmail({

      to:
        email,

      subject:
        "Security Alert - Your Account Was Logged In",

      text: `
Hello ${name},

Your account was logged in successfully.

Login Time:
${loginTime}

IP Address:
${ipAddress || "Unknown"}

If this was you,
no action is required.

If you did not login to your account,
please change your password immediately.
      `,

      html: `
        <div
          style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
          "
        >

          <h2>
            Login Successful
          </h2>

          <p>
            Hello ${name},
          </p>

          <p>
            Your account was logged in successfully.
          </p>

          <p>
            <strong>
              Login Time:
            </strong>
            ${loginTime}
          </p>

          <p>
            <strong>
              IP Address:
            </strong>
            ${ipAddress || "Unknown"}
          </p>

          <p>
            If this was you,
            no action is required.
          </p>

          <p style="color: red;">
            If you did not login to your account,
            please change your password immediately.
          </p>

        </div>
      `,
    });
  };

// ==========================================
// Send Forgot Password Email
// ==========================================

const sendPasswordResetEmail =
  async ({
    name,
    email,
    resetUrl,
  }) => {

    return sendEmail({

      to:
        email,

      subject:
        "Password Reset Request",

      text: `
Hello ${name},

You requested a password reset.

Use the following link to reset your password:

${resetUrl}

This link will expire in 15 minutes.

If you did not request a password reset,
you can safely ignore this email.
      `,

      html: `
        <div
          style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
          "
        >

          <h2>
            Password Reset Request
          </h2>

          <p>
            Hello ${name},
          </p>

          <p>
            You requested a password reset.
          </p>

          <p>
            Click the button below to create
            a new password.
          </p>

          <p>
            <a
              href="${resetUrl}"
              style="
                display: inline-block;
                padding: 12px 20px;
                background: #2563eb;
                color: white;
                text-decoration: none;
                border-radius: 5px;
              "
            >
              Reset Password
            </a>
          </p>

          <p>
            Or use this link:
          </p>

          <p>
            ${resetUrl}
          </p>

          <p>
            This link will expire in
            <strong>
              15 minutes
            </strong>.
          </p>

          <p>
            If you did not request this,
            you can safely ignore this email.
          </p>

        </div>
      `,
    });
  };

// ==========================================
// Send Password Changed Email
// ==========================================

const sendPasswordChangedEmail =
  async ({
    name,
    email,
  }) => {

    return sendEmail({

      to:
        email,

      subject:
        "Your Password Has Been Changed",

      text: `
Hello ${name},

Your password was changed successfully.

You can now login using your new password.

If you did not make this change,
please contact the administrator immediately.
      `,

      html: `
        <div
          style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
          "
        >

          <h2>
            Password Changed Successfully
          </h2>

          <p>
            Hello ${name},
          </p>

          <p>
            Your password has been changed successfully.
          </p>

          <p>
            You can now login using your new password.
          </p>

          <p style="color: red;">
            If you did not make this change,
            please contact the administrator immediately.
          </p>

        </div>
      `,
    });
  };

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  sendEmail,
  verifyEmailConnection,
  sendWelcomePasswordEmail,
  sendLoginNotificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
};