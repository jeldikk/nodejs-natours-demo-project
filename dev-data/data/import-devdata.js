const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Tour = require('../../models/tours-model');

dotenv.config({
  path: './config.env',
});

let operationType;

const DB_URL = process.env['DATABASE'].replace(
  /<PASSWORD>/,
  process.env.DATABASE_PASSWORD
);

// console.log({ dirname: __dirname });
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours-simple.json`, { encoding: 'utf-8' })
);

// console.log(process.argv);
// console.log({ tours });

switch (process.argv[2]) {
  case '--import':
    operationType = 'import';
    break;
  case '--delete':
    operationType = 'delete';
    break;
}

mongoose
  .connect(DB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true,
  })
  .then((conn) => {
    console.log('successfully connected to database');
  })
  .catch((err) => {
    console.error('Error occurred while connecting to database', err);
  });

const createTours = async () => {
  console.log('creating tours');
  try {
    await Tour.create(tours);
    console.log('successfully imported data by importing json file');
    process.exit();
  } catch (err) {
    console.log('Error occured while creating tours', err);
  }
};

const deleteTours = async () => {
  try {
    await Tour.deleteMany();
    conosle.log('successfully deleted all records from database');
    process.exit();
  } catch (err) {
    console.log('Error occured while deleting records', err);
  }
};

console.log({ operationType });

switch (operationType) {
  case 'import':
    createTours();
    break;
  case 'delete':
    deleteTours();
    break;
  default:
    console.log('No proper operation is given');
}
