const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  const { to, subject, html } = options;

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: false,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: '"Luxeon" <MS_PdLQzN@trial-3vz9dle8r8plkj50.mlsender.net>',
    to,
    subject,
    html,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        reject(err);
      } else {
        resolve(info);
      }
    });
  });
};

module.exports = sendEmail;
