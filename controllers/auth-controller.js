const util = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/users-model');
const AppError = require('../utils/app-error');
const catchAsync = require('../utils/catch-async');
const { sendMail } = require('../utils/email-mailer');

const createAndSendToken = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions['secure'] = true;
  }

  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: {
        username: user.username,
        name: user.name,
        email: user.email,
        photo: user.photo,
      },
    },
  });
};

const signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    username: req.body.username,
    name: req.body.name,
    email: req.body.email,
    photo: req.body.photo,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordModifiedAt: req.body.passwordModifiedAt,
  });

  createAndSendToken(newUser, 201, res);
  // const token = jwt.sign(
  //   { id: newUser._id, username: newUser.username },
  //   process.env.JWT_SECRET,
  //   { expiresIn: process.env.JWT_EXPIRES_IN }
  // );
  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: {
  //       username: newUser.username,
  //       name: newUser.name,
  //       email: newUser.email,
  //       photo: newUser.photo,
  //     },
  //   },
  // });
});

const login = catchAsync(async (req, res, next) => {
  console.log('we are in a login page');
  const { email, password } = req.body;

  //check if email and password are present in payload
  if (!email || !password) {
    return next(new AppError(400, 'email or password is missing in request'));
  }

  //check if user exists with the password
  const user = await User.findOne({ email });
  console.log({ user, email, password });
  // const comparison = ;

  if (!user || !(await user.comparePassword(user.password, password))) {
    return next(new AppError(401, 'Incorrect Email or Password'));
  }

  console.log('this is before signing token');

  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  console.log('this is after signing token');

  res.status(200).json({
    status: 'success',
    token,
    user: {
      username: user.username,
      email: user.email,
      name: user.name,
    },
  });
});

const routesProtector = catchAsync(async (req, res, next) => {
  // 1. checking the token if it exists and getting the token
  if (
    !req.headers['authorization'] ||
    !req.headers['authorization'].startsWith('Bearer')
  ) {
    return next(
      new AppError(401, 'Authorization token is missing from request')
    );
  }
  //getting token from authorization header key by splitting as it is of form Bearer <token>
  let token = req.headers['authorization'].split(' ')[1];
  if (!token) {
    return next(
      new AppError(401, 'User is not authorised to access this resource')
    );
  }
  // console.log({ token });

  // 2. Verification of token - we use the jwt.verify
  // if there is any error; token expired, invalid signature below code will throw error
  const decodedData = await util.promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );
  // console.log({ decodedData });
  // 3. Check if the user still exists after verifying the token
  const freshUser = await User.findById(decodedData.id);
  if (!freshUser) {
    return next(
      new AppError(
        'Invalid user found from token information or user no longer exists',
        401
      )
    );
  }
  // console.log({ freshUser });
  // 4. Check if user changed password after token is issued
  const passwordChanged = freshUser.isPasswordChanged({
    iat: decodedData.iat,
    exp: decodedData.exp,
  });
  if (passwordChanged) {
    return next(
      new AppError(
        401,
        'Password was modified after this token is issued, please login again'
      )
    );
  }
  req.user = freshUser;
  next();
});

const restrictTo = (...roles) => {
  return (req, res, next) => {
    console.log({ user: req.user, roles });
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(403, 'User is not privileged to perform this operation')
      );
    }
    next();
  };
};

const forgotPassword = catchAsync(async (req, res, next) => {
  // Get email in req body and check if user exist with given email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(
      new AppError(404, 'No User Found for given email address in records')
    );
  }

  //generate Password reset token which is to be sent to email address provided
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });
  // console.log({ req });
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/reset-password/${resetToken}`;

  const message = `Forgot you password ? Submit a PATCH request with your new password and password Confirm to ${resetUrl}.\n If you didn't forgot your password, Please ignore this email!`;

  try {
    await sendMail({
      email: req.body.email,
      subject: 'Your Password reset token is valid for 10mins',
      message,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordTokenExpiresIn = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        500,
        'Error occured while send a reset token through email, Please try again'
      )
    );
  }

  res.status(200).json({
    status: 'success',
    message: 'Token sent to provided Email',
  });
});

const resetPassword = catchAsync(async (req, res, next) => {
  console.log({ body: req.body });
  // 0. You will get token as param in url
  console.log('resetPassword functionality is called');
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params['resetToken'])
    .digest('hex');

  //1. Get User based on token and check if user exists
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordTokenExpiresIn: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new AppError(
        404,
        'User who requested the token, token has expired or user no longer exists'
      )
    );
  }

  //2. check if reset token has not expired and if not set the new password
  // console.log({
  //   time: Date.now(),
  //   expiresIn: user.passwordTokenExpiresIn.getTime(),
  // });
  // if (Date.now() < user.passwordTokenExpiresIn.getTime()) {
  //   //there is time to expire token
  // }

  user.password = req.body.password;
  user.passwordConfirm = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordTokenExpiresIn = undefined;
  await user.save();

  console.log({ user });
  //3. update passwordModifiedAt property on the user object

  //4. Log In the user and send JWT token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  res.status(200).json({
    status: 'success',
    token,
    user: {
      username: user.username,
      email: user.email,
      name: user.name,
    },
  });
});

const updatePassword = catchAsync(async (req, res, next) => {
  // check if new password and confirm password are present and same
  // if (req.body['newPassword'] !== req.body['confirmNewPassword']) {
  //   return next(
  //     new AppError(
  //       500,
  //       'Either improper data or new password and confirmation passwords do not match'
  //     )
  //   );
  // }
  // console.log('this is coming after conditional block');
  // // console.log({ headers: req.headers });
  // const token = req.headers['authorization'].split(' ')[1];
  // const decodedData = await util.promisify(jwt.verify)(
  //   token,
  //   process.env.JWT_SECRET
  // );
  // console.log({ decodedData });
  // // Get user from collection
  // const user = await User.findById(decodedData.id);
  // if (!user) {
  //   return next(new AppError(403, 'User is not authorized or does not exist'));
  // }
  //We will use routesProtector as middleware, so we will get user data in request from previous middleware
  const user = req.user;
  //Check if old password is correct
  const comparison = await user.comparePassword(
    user.password,
    req.body['oldPassword']
  );
  //If password is correct, update the password
  if (!comparison) {
    return next(
      new AppError(403, 'User is not authorised or properly identified')
    );
  }
  user.password = req.body['newPassword'];
  user.passwordConfirm = req.body['confirmNewPassword'];
  await user.save();
  //Log user In, send updated JWT
  const newToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  res.status(200).json({
    status: 'success',
    token: newToken,
    user: {
      username: user.username,
      email: user.email,
      name: user.name,
    },
  });
});

exports.signup = signup;
exports.login = login;
exports.routesProtector = routesProtector;
exports.restrictTo = restrictTo;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.updatePassword = updatePassword;
