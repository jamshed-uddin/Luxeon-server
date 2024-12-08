const passwordResetTemplate = (resetLink) => {
  const resetTemplate = `<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f9f9f9;
        color: #333;
        line-height: 1.6;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        background: #fff;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .header {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 20px;
      }
      .content {
        margin-top: 10px;
      }
      .button {
        display: inline-block;
        
        padding: 10px 20px;
        background-color: #000;
        color: #fff;
        text-decoration: none;
        font-weight: bold;
        border-radius: 5px;
      }
      .footer {
        margin-top: 30px;
        font-size: 12px;
        color: #666;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1 >Luxeon</h1>
      <div class="content">
        <p>
          We received a request to change your password. Click the Link below
          to reset the password.
        </p>
        <a href="${resetLink}" class="button" target="_blank" rel="noreferrer noopener">Reset Password</a>

        <p>
          For security reasons, this link is valid for 15 minutes. If you didn't
          request a password reset, ignore this message.
        </p>
        <p>Luxeon </p>
     
      </div>
    </div>
  </body>
</html>
`;

  return resetTemplate;
};

module.exports = passwordResetTemplate;
