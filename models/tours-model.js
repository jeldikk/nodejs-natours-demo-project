const mongoose = require('mongoose');
const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A Tour must have a name'],
      unique: true,
      maxlength: [40, 'A Tour must be of maxlength 40'],
      minlength: [10, 'A Tour must be of minimum 10 chars wide'],
      validate: [
        validator.isAlpha,
        'Tour name must only contain alplhabet characters',
      ],
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 5,
    },
    price: {
      type: Number,
      required: [true, 'A Tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      default: 0,
      validate: {
        validator: function (value) {
          console.log('discount value got is ', value);
          return value < this.price;
        },
        message: 'Discount price ({VALUE}) should be below the regular price',
      },
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A Tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficulty'],
        message: 'difficulty can be either easy, medium or difficulty',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'ratingsAverage can be a minimum of 1'],
      max: [5, 'ratingsAverage cannot be more than 5'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
    },
    summary: {
      type: String,
      trim: true, // all the whitespace in beginning and end will be removed
      required: [true, 'A Tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A Tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: {
      type: [Date],
    },
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

tourSchema.virtual('durationWeeks').get(function () {
  return (this.duration / 7).toFixed(2);
});

//this is document middleware called before .save() or .create() methods
tourSchema.pre('save', function (next) {
  // console.log('this is called before saving document', doc);
  this.start = Date.now();
  next(); // this will call the next pre save hooks
});

tourSchema.post('save', function (doc, next) {
  console.log('this is called after saving document');
  console.log(
    `It took ${Date.now() - this.start} milliseconds to save document`
  );
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(
    `Querying took ${Date.now() - this.start} milli seconds to find documents`
  );
  next();
});

tourSchema.pre('aggregate', function (next) {
  console.log('calling from pre aggregate callback');
  console.log(this.pipeline());
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
