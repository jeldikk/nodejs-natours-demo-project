const nodemailer = require('nodemailer');

//We can also even use Gmail, Yahoo, Hotmail and similar service,
// we need to configure transporter with those services
exports.sendMail = async (options) => {
  //Create Transporter or channel through which we are going to send the email
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  //Create mail options like from, to, subject and email body
  const mailOptions = {
    from: 'J Kamal Kumar <jeldi.kamal2011@natours.io',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  //Send the actual email
  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {}
};
