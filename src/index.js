'use strict';

// load modules
var express = require('express');
var morgan = require('morgan');
var jsonParser = require('body-parser').json;

var app = express();
var routes = require('./routes');

//logger for http logging
app.use(morgan('dev'));
// Parse JSON
app.use(jsonParser());

require('./models/user');
require('./models/course');
require('./models/review');


var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/courses');

var db = mongoose.connection;

db.on('error', function(err) {
  console.error('connection error:', err);
});

db.once('open', function() {
  var seeder = require('mongoose-seeder');

  var data = require('./data/data.json');
  seeder.seed(data).then(function(dbData){
    console.log('success! ' + dbData);
  }).catch(function(err) {
    if (err) console.log(err);
  });
  console.log('db connection successful');
});

// set our port
app.set('port', process.env.PORT || 5000);

// morgan gives us http request logging
app.use(morgan('dev'));

// setup our static route to serve files from the "public" folder
app.use('/', express.static('public'));

app.use('/api', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('File Not Found');
  err.status = 404;
  next(err);
});

// error handler
// define as the last app.use callback
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    error: err.message
  });
});


// start listening on our port
var server = app.listen(app.get('port'), function() {
  console.log('Express server is listening on port ' + server.address().port);  
});
