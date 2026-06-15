var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('./jobs/deleteS3Documents');
require('./jobs/deleteInvitedUser');
require('./jobs/deleteFailedDocument');
require('./queues/workers/emailWorker');
console.log('Email Worker Started');

var indexRouter = require('./routes/index');

var app = express();

const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(
  cors({
    origin: /^http:\/\/([a-zA-Z0-9-]+)\.192\.168\.100\.166\.nip\.io:5173$/,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true
  })
);
app.options('*', cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/test', (req, res, next) => {
  res.send("test");
});
app.use('/api/v1', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(errorHandler);

module.exports = app;
