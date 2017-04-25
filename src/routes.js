'use strict';

var express = require('express');
var router = express.Router();
var Course = require('./models/course');
var Review = require('./models/review');
var User = require('./models/user');
var Auth = require('./auth');

router.param('cID', function(req, res, next, id) {
  Course.findById(req.params.cID)
      .populate('user', '_id fullName')
      .populate({
          path: 'reviews',
          model: 'Review',
          populate: {
              path: 'user',
              model: 'User',
              select: '_id fullName'
          }
      })
      .exec(function(err, doc) {
      if (err) return next(err);
      if (!doc) {
          err = new Error("Not Found");
          err.status = 404;
          return next(err);
      }
      req.course = doc;
      return next();
  })
});

router.get('/courses', function(req, res, next) {
    res.status(200);
    Course.find({}, '_id title')
        .exec(function(err, courses){
            if (err) {
                return next(err);
            }

            res.json({data: courses});
        });
});

router.get('/courses/:cID', function(req, res, next) {
    res.status(200);
    var dataArray = [];
    dataArray.push(req.course.toObject({virtuals: true}));
    console.log(req.course.user);
    res.json({data: dataArray});
});

// Create a course
router.post('/courses', Auth, function(req, res, next){

    if (req.body.user._id === req.user._id.toJSON()) {
        var course = new Course(req.body);

        // Make sure the step numbers equal to the index in the course plus one i.e. starts from 1
        for (var i = 0; i < course.steps.length; i++) {
            course.steps[i].stepNumber = i + 1;
        }

        // save new course
        course.save(function(err) {
            // display custom error message
            if (err) {
                if (err.name === 'ValidationError') {
                    var errors = [];

                    if (err.errors.title) {
                        errors.push({code: 400, message: err.errors.title.message});
                    }

                    if (err.errors.description) {
                        errors.push({code: 400, message: err.errors.description.message});
                    }

                    if (err.errors['steps.0.title']) {
                        errors.push({code: 400, message: err.errors['steps.0.title'].message});
                    }

                    if (err.errors['steps.0.description']) {
                        errors.push({code: 400, message: err.errors['steps.0.description'].message});
                    }

                    var errorMessages = { message: 'Validation Failed', errors: { property: errors}};
                    return res.status(400).json(errorMessages);
                } else {
                    // if not a validation error, send to middleware error handler
                    return next(err);
                }
            }

            res.location('/courses/');
            return res.sendStatus(201);
        })

    } else {
        var error = new Error('You can only create a course for yourself');
        err.status = 401;
        return next(err);
    }

});

router.put('/courses/:cID', Auth, function(req, res, next){
    var user = req.user._id.toJSON();
    var courseOwner = req.course.user._id.toJSON();
    var authorized = (user === courseOwner);

    if (authorized) {

        // save new course
        req.course.update(req.body, {runValidators: true}, function(err, course) {
            // display custom error message
            if (err) {
                if (err.name === 'ValidationError') {
                    var errors = [];

                    if (err.errors.title) {
                        errors.push({code: 400, message: err.errors.title.message});
                    }

                    if (err.errors.description) {
                        errors.push({code: 400, message: err.errors.description.message});
                    }

                    if (err.errors['steps.0.title']) {
                        errors.push({code: 400, message: err.errors['steps.0.title'].message});
                    }

                    if (err.errors['steps.0.description']) {
                        errors.push({code: 400, message: err.errors['steps.0.description'].message});
                    }

                    var errorMessages = { message: 'Validation Failed', errors: { property: errors}};
                    return res.status(400).json(errorMessages);
                } else {
                    // if not a validation error, send to middleware error handler
                    return next(err);
                }
            }

            // return response
            return res.sendStatus(204);
        })

    } else {
        var error = new Error('You can only create a course for yourself');
        error.status = 401;
        return next(error);
    }
});


router.get('/users', Auth, function(req, res, next) {
    // go through the auth middleware and respond in json
    var authorisedUser = {};
    authorisedUser.data = [];
    authorisedUser.data.push(req.user);
    res.json(authorisedUser);
});

router.post('/users', function(req, res, next){

    // Check that both password fields have been filled out
    if (req.body.password !== req.body.confirmPassword) {
        // Return validation error
        return res.status(400).json({
            message: 'Validation Failed', errors: { property: [ { code: 400, message: 'Password fields do not match.' } ] }
        });
    }

    var user = new User();

    user.fullName = req.body.fullName;
    user.emailAddress = req.body.emailAddress;
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;

    user.save(function(err){
       if (err) {
           if (err.name === 'ValidationError') {
               var errorArray = [];

               if (err.errors.fullName) {
                   errorArray.push({ code: 400, message: err.errors.fullName.message });
               }

               if (err.errors.emailAddress) {
                   errorArray.push({ code: 400, message: err.errors.emailAddress.message });
               }

               if (err.errors.password) {
                   errorArray.push({ code: 400, message: err.errors.password.message });
               }

               if (err.errors.confirmPassword) {
                   errorArray.push({ code: 400, message: err.errors.confirmPassword.message });
               }

               var errorMessages = { message: 'Validation Failed', errors: { property: errorArray } };
               return res.status(400).json(errorMessages);

           } else {
               return next(err);
           }
       }
        res.location('/');
        return res.status(201).send();

    });

});

router.post('/courses/:cID/reviews', Auth, function(req, res, next) {
    var review = new Review(req.body);
    review.user = req.user;

    // The course owner can't review their own course
    if (req.user._id.toJSON() === req.course.user._id.toJSON()) {
        var err = new Error("You can't review your own course");
        err.status = 401;
        return next(err);
    }

    // The same user can't review more than once
    for (var i = 0; i < req.course.reviews.length; i++) {
        if (req.course.reviews[i].user._id.toJSON() === req.user._id.toJSON()) {
            var err = new Error("You can only review the course once");
            err.status = 401;
            return next(err);
        }
    }

    req.course.reviews.push(review);

    // Save the course
    req.course.save(function(err) {
       if (err) return next(err);
    });

    // Save the review details
    review.save(function(err){
       if (err) {
           // Check for validation errors
           if (err.name === 'ValidationError') {
               return res.status(400).json({
                   message: 'Validation Failed',
                   errors: {
                       property: [ { code: 400, message: err.errors.rating.message } ]
                   }
               })
           } else {
               return next(err);
           }
       }
       res.status(201);
       res.location('/courses/' + req.course._id);
       res.end();
    });
});

router.delete('/courses/:cID/reviews/:reviewID', Auth, function(req, res, next) {
    Review.findById(req.params.reviewID)
        .populate('user')
        .exec(function(err, review) {
            if (err) return next(err);

            // Retrieve the current user, the course owner and the review owner
            var currentUser = req.user._id.toJSON();
            var courseOwner = req.course.user._id.toJSON();
            var reviewOwner = review.user._id.toJSON();
            // Only the review's user or course owner can delete a review
            if (currentUser === courseOwner || currentUser === reviewOwner) {

                // Remove the review.
                Review.findById(req.params.reviewID)
                    .remove()
                    .exec(function(err) {
                        if (err) return next(err);
                    });

                return res.sendStatus(204);

            } else {
                var err = new Error('Only the review creator or course creator can delete a review.');
                err.status = 401;
                return next(err);
            }
        });
});


module.exports = router;