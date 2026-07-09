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
    origin: (origin, callback) => {
      // Allow requests without Origin (Postman, mobile apps, health checks)
      if (!origin) {
        return callback(null, true);
      }

      // Allow localhost during development
      if (origin === "http://localhost:5173") {
        return callback(null, true);
      }

      // Allow any HTTPS subdomain of doccenter.in
      const allowedRegex = /^https:\/\/([a-zA-Z0-9-]+)\.doccenter\.in$/;

      if (allowedRegex.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
app.options('*', cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: "UP",
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

app.use('/api/v1', indexRouter);
app.use('/sdk', require('./routes/sdk.routes'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(errorHandler);

module.exports = app;
