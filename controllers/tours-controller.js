const fs = require('fs');
const Tour = require('../models/tours-model');
const APIFeatures = require('../utils/api-features');
const AppError = require('../utils/app-error');
const catchAsync = require('../utils/catch-async');

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`, {
    encoding: 'utf-8',
  })
);

const topFiveCheapest = (req, res, next) => {
  (req.query.limit = '5'), (req.query.sort = '-ratingsAverage,price');
  req.query.fields =
    'name,duration,ratingsAverage,rating,difficulty,price,summary,description';
  next();
};

const getAllTours = catchAsync(async (req, res) => {
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .selectFields()
    .paginate();

  const tours = await features.mongooseQuery;

  res.status(200).json({
    status: 'success',
    count: tours.length,
    tours,
  });
});

/*
{
            "rating": 4.5,
            "ratingsAverage": 4.8,
            "ratingsQuantity": 23,
            "images": [
                "tour-2-1.jpg",
                "tour-2-2.jpg",
                "tour-2-3.jpg"
            ],
            "startDates": [
                "2021-06-19T04:30:00.000Z",
                "2021-07-20T04:30:00.000Z",
                "2021-08-18T04:30:00.000Z"
            ],
            "_id": "63171d2d18924552a06d9299",
            "name": "The Sea Explorer",
            "duration": 7,
            "maxGroupSize": 15,
            "difficulty": "medium",
            "price": 497,
            "summary": "Exploring the jaw-dropping US east coast by foot and by boat",
            "description": "Consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\nIrure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
            "imageCover": "tour-2-cover.jpg"
        },

*/

const getTourStats = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    {
      $unwind: {
        path: '$startDates',
      },
    },
    {
      $match: {
        _id: { $ne: '' },
      },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' }  ,
        numTours: { $sum: 1 },
        totalRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
    {
      $match: {
        _id: {
          $ne: 'EASY',
        },
      },
    },
    {
      $project: {
        numTours: 1,
        totalRatings: 1,
        avgRating: { $round: ['$avgRating', 2] },
        avgPrice: { $round: ['$avgPrice', 2] },
        minPrice: { $round: ['$minPrice', 2] },
        maxPrice: { $round: ['$maxPrice', 2] },
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: stats,
  });
});

const getMonthlyStats = catchAsync(async (req, res) => {
  let { year } = req.params;
  year = year * 1;
  console.log({ year });
  const stats = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: {
          $month: '$startDates',
        },
        tours: {
          $push: '$name',
        },
        toursCount: { $sum: 1 },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: stats,
  });
});

const getTourById = catchAsync(async (req, res, next) => {
  const { tourId } = req.params;

  const tour = await Tour.findById(tourId);
  // Tour.findOne()
  if (!tour) {
    // return next(new AppError(404, 'No tour found with the id'));
    throw new AppError(404, 'cannot find tour with given id');
  }

  res.status(200).json({
    status: 'success',
    tour,
  });
});

const createTour = catchAsync(async (req, res, next) => {
  const doc = await Tour.create(req.body);
  res.status(201).json({
    status: 'success',
    data: doc,
  });
});

const updateTour = catchAsync(async (req, res) => {
  const { tourId } = req.params;
  console.log({ tourId, body: req.body });
  const updatedTour = await Tour.findByIdAndUpdate(tourId, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    tour: updatedTour,
  });
});

const deleteTour = catchAsync(async (req, res) => {
  const { tourId } = req.params;
  const tour = await Tour.findByIdAndDelete(tourId);
  console.log({ tour });
  res.status(204).json({
    status: 'success',
    tour: null,
  });
});

const checkNameProperty = (req, res, next) => {
  const { name } = req.body;
  console.log('we are about to check the body of request');
  if (!name) {
    return res.status(400).json({
      status: 'error',
      message: 'name property is missing from the payload',
    });
  }
  next();
};

const checkPriceProperty = (req, res, next) => {
  const { price } = req.body;
  if (!price) {
    return res.status(400).json({
      status: 'error',
      message: 'price property is missing from the payload',
    });
  }
  next();
};

exports.getAllTours = getAllTours;
exports.createTour = createTour;
exports.getTourById = getTourById;
exports.updateTour = updateTour;
exports.deleteTour = deleteTour;
exports.checkNameProperty = checkNameProperty;
exports.checkPriceProperty = checkPriceProperty;
exports.topFiveCheapest = topFiveCheapest;
exports.getTourStats = getTourStats;
exports.getMonthlyStats = getMonthlyStats;
