const AppError = require('./app-error');

module.exports = (fn) => {
  return (req, res, next) => {
    console.log('calling catchAsync function');
    fn(req, res, next).catch((err) => {
      const error = new AppError(500, err.message);
      next(error);
    });
  };
};
