const express = require('express');
const {
  getAllTours,
  getTourById,
  createTour,
  updateTour,
  deleteTour,
  topFiveCheapest,
  checkNameProperty,
  checkPriceProperty,
  getTourStats,
  getMonthlyStats,
} = require('../controllers/tours-controller');

const {
  routesProtector,
  restrictTo,
} = require('../controllers/auth-controller');

const toursRouter = express.Router();

// toursRouter.param('tourId', (req, res, next, val) => {
//   console.log('recieved val is : ', val);
//   next();
// });

toursRouter.route('/').get(routesProtector, getAllTours).post(createTour);
toursRouter.route('/tours-stats').get(getTourStats);
toursRouter.route('/top-five-cheapest').get(topFiveCheapest, getAllTours);
toursRouter.route('/monthly-tours/:year').get(getMonthlyStats);

toursRouter
  .route('/:tourId')
  .get(getTourById)
  .patch(updateTour)
  .delete(routesProtector, restrictTo('lead-guide', 'admin'), deleteTour);

module.exports = toursRouter;
