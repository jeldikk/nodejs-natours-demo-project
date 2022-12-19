const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const usersSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'A User must have a username'],
    unique: true,
  },
  name: {
    type: String,
    required: [true, 'A user must have a name. Please tell us your name'],
  },
  email: {
    type: String,
    required: [true, 'email is a must for a user'],
    unique: true,
    lowerCase: true,
    validate: [validator.isEmail, 'A user must have a valid email id'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'A password must be of length minimum 8'],
  },
  passwordConfirm: {
    type: String,
    required: [true, 'please confirm your password'],
    validate: {
      // this validator works only on .save or .create. so when updating password we should not use findOneAndUpdate
      // but we should use save instead.
      validator: function (value) {
        return value === this.password;
      },
      message: 'confirmation password should match with the original password',
    },
  },
  passwordModifiedAt: {
    type: Date,
    select: false,
  },
  passwordResetToken: { type: String, select: false },
  passwordTokenExpiresIn: { type: Date, select: false },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

//mostly the hashing part is done in models only to obey the fat models and thin controllers philosophy
//this get called before calling save method.
usersSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  //Here 12 is called as salt, which defines the time the system takes to hash the plain text password
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
});

//Middleware for saving passwordModifiedAt when password is Modified
usersSchema.pre('save', function (next) {
  //Below block executes when password is not modified or if the document is new
  if (!this.isModified('password') || this.isNew) return next();

  //we are subtracting 1sec because; in real time database updation will happen late than token is issued.
  //So it is good to having passwordModifiedAt attribute to be little delayed. so we are subtracting 1sec to past
  // well, this is not a correct procedure but will work in real time.
  this.passwordModifiedAt = Date.now() - 1000;
  next();
});

usersSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

usersSchema.methods.comparePassword = async function (
  dbPassword,
  userPassword
) {
  const comparison = await bcrypt.compare(userPassword, dbPassword);
  console.log({ dbPassword, userPassword, comparison });
  return comparison;
};

usersSchema.methods.isPasswordChanged = function (jwtTimestamp) {
  if (!!this.passwordModifiedAt) {
    console.log({
      passwordModifiedAt: parseInt(
        this.passwordModifiedAt.getTime() / 1000,
        10
      ),
      jwtTimestamp,
    });
    const passwordModifiedTime = parseInt(
      this.passwordModifiedAt.getTime() / 1000,
      10
    );
    if (passwordModifiedTime > jwtTimestamp.iat) {
      return true;
    }
  }
  return false;
};

usersSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  const encryptedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetToken = encryptedToken;
  this.passwordTokenExpiresIn = Date.now() + 10 * 60 * 1000;

  console.log({ resetToken, encryptedToken });

  return resetToken;
};

const User = mongoose.model('User', usersSchema);

module.exports = User;
