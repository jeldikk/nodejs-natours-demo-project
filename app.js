const fs = require('fs');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');

const globalErrorHandler = require('./controllers/errors-controller');
const usersRouter = require('./routes/users-routes');
const toursRouter = require('./routes/tours-routes');
const AppError = require('./utils/app-error');

const app = express();

//MIDDLEWARES

//calling express.json() will return a  function
app.use(express.json({ limit: '10kb' }));
app.use(express.static(`${__dirname}/public`));

//helmet middleware to have secure headers
app.use(helmet());

//sanitize req.body, req.params, req.query against NoSQL query injection attack
app.use(mongoSanitize());

//sanitize any html or javascript code attached in input by converting all those symbols to codes
app.use(xssClean());

//Rate Limiting using express-rate-limit
const rateLimitingMiddleware = rateLimit({
  max: process.env.RATE_LIMIT_MAX * 1,
  windowMs: process.env.RATE_LIMIT_WINDOW * 1 * 60 * 60 * 1000,
  message: 'Too many request from this IP, Please try again in an hour.',
});

app.use(rateLimitingMiddleware);

console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// app.use((req, res, next) => {
//   console.log('Hello from the middleware');
//   next();
// });

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//ROUTE HANDLERS

// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:tourId', getTourById);
// app.post('/api/v1/tours', createTour);

// //there are two HTTP verbs used to update data
// // put: we expect we get whole object in request body
// // path: we expect to get only the fields that are to be updated in the request body
// app.patch('/api/v1/tours/:tourId', updateTour);
// app.delete('/api/v1/tours/:tourId', deleteTour);

//ROUTERS TO BE MOUNTED

app.use('/api/v1/tours', toursRouter);
app.use('/api/v1/users', usersRouter);
//ROUTES

//Handling un-registered routes
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this service`,
  // });
  // const err = new Error(`Can't find ${req.originalUrl} on this service`);
  // (err.statusCode = '404'), (err.status = 'fail');
  const err = new AppError(
    404,
    `Can't find ${req.originalUrl} on this service`
  );

  next(err);
});

//Some global place for registering errors
app.use(globalErrorHandler);

module.exports = app;

//START THE SERVER
