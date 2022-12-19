const User = require('../models/users-model');
const AppError = require('../utils/app-error');
const catchAsync = require('../utils/catch-async');

exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find().select({ __v: 0, password: 0 });
  // res.status(500).json({
  //   status: 'error',
  //   message: 'getAllUsers functionality is not yet defined',
  // });
  res.status(200).json({
    status: 'success',
    data: {
      users,
    },
  });
});

//The below handler is backed with routesProtector middleware, So we will have user instance in request
exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log('calling from updateMe');
  const onlyFields = ['name', 'email'];
  // console.log('I am in update me details handler');
  //Create error if user tries to update password using this route
  if (req.body['password'] || req.body['passwordConfirm']) {
    return next(
      new AppError(
        400,
        'This url is for updating user details. For password updates use /update-my-password instead'
      )
    );
  }

  const payload = {};

  Object.keys(req.body).forEach((key) => {
    if (onlyFields.includes(key)) {
      payload[key] = req.body[key];
    }
  });
  const updatedUser = await User.findByIdAndUpdate(req.user._id, payload, {
    new: true,
    runValidators: true,
  });
  console.log({ reqBody: req.body, payload, updatedUser });
  res.status(200).json({
    status: 'success',
    user: updatedUser,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  const user = req.user;
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'createUser functionality is not yet defined',
  });
};

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'getUser functionality is not yet defined',
  });
};

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'updateUser functionality is not yet defined',
  });
};

exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'deleteUser functionality is not yet defined',
  });
};
