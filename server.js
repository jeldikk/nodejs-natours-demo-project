const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({
  path: './config.env',
});

const DB_URL = process.env['DATABASE'].replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

console.log({ db_url: DB_URL });

mongoose
  .connect(DB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((conn) => {
    console.log('DB Connection is successful');
  })
  .catch((err) => {
    console.log('Error occurred when connecting to database');
  });

const app = require('./app');

const { NODE_ENV, USER, PASSWORD, PORT, HOST } = process.env;

console.log({ NODE_ENV, USER, PASSWORD, PORT, HOST });

app.listen(PORT, HOST, () => {
  console.log(`Listening server on ${HOST}:${PORT}`);
});

// TEST