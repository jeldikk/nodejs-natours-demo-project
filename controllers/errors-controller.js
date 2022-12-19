function devErrorResponse(err, res) {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    errors: err.errors,
    stack: err.stack,
  });
}

function prodErrorResponse(err, res) {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
}

module.exports = (err, req, res, next) => {
  console.log({ stack: err.stack });
  if (process.env.NODE_ENV === 'development') {
    devErrorResponse(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    prodErrorResponse(err, res);
  }
};
