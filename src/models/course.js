'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var CourseSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    title: {
        type: String,
        required: [true, 'Please enter a course title']
    },
    description: {
        type: String,
        required: [true, 'Please enter a course description']
    },
    estimatedTime: String,
    materialsNeeded: String,
    steps: [{
        stepNumber: Number,
        title: {
            type: String,
            required: [true, 'Please enter a step title'],
        },
        description: {
            type: String,
            required: [true, 'Please enter a step description']
        }
    }],
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    }]
});

// Need to make sure course contains at least one step
CourseSchema.path('steps').validate(function (steps) {
   if (!steps) {
       return false;
   } else if (steps.length === 0) {
       return false;
   }
   return true;
});

// pre-save, create step numbers
CourseSchema.pre('save', function(next) {
    var course = this;
    for (var i = 0; i<course.steps.length; i++) {
        course.steps[i].stepNumber = i + 1;
    }
    next();
});




CourseSchema.virtual('overallRating').get(function(){
   var total = 0;
   for (var i=0; i < this.reviews.length; i++) {
       total += this.reviews[i].rating;
   }
   var overallRating = Math.round(total/this.reviews.length);

   return overallRating;
});
var Course = mongoose.model('Course', CourseSchema);

module.exports = Course;