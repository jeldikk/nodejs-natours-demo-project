const express = require('express');
// const {
//   getAllUsers,
//   createUser,
//   getUser,
//   updateUser,
//   deleteUser,
// } = require('../controllers/users-controller');
const usersController = require('../controllers/users-controller');
const authController = require('../controllers/auth-controller');

const usersRouter = express.Router();

usersRouter.post('/signup', authController.signup);
usersRouter.post('/login', authController.login);

usersRouter.post('/forgot-password', authController.forgotPassword);
usersRouter.patch('/reset-password/:resetToken', authController.resetPassword);
usersRouter.patch(
  '/update-my-password',
  authController.routesProtector,
  authController.updatePassword
);

usersRouter.patch(
  '/update-my-details',
  authController.routesProtector,
  usersController.updateMe
);
usersRouter.delete(
  '/delete-me',
  authController.routesProtector,
  usersController.deleteMe
);

usersRouter
  .route('/')
  .get(usersController.getAllUsers)
  .post(usersController.createUser);

usersRouter
  .route('/:id')
  .get(usersController.getUser)
  .patch(usersController.updateUser)
  .delete(usersController.deleteUser);

module.exports = usersRouter;
