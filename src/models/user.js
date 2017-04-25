'use strict';

var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var validator = require('validator');

var UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Please enter your name'],
    },
    emailAddress: {
        type: String,
        required: [true, 'Please enter your email'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Please enter your password']
    },
    confirmPassword: {
        type: String,
        required: [true, 'Please confirm your password']
    }
});

// check that the email is valid
UserSchema.path('emailAddress').validate(function (v) {
    return validator.isEmail(v);
}, 'Please enter a valid email address');

// hash password before saving to database
UserSchema.pre('save', function(next){
    var numSaltRounds = 10;

    var salt = bcrypt.genSaltSync(numSaltRounds);
    this.password = bcrypt.hashSync(this.password, salt);
    this.confirmPassword = bcrypt.hashSync(this.confirmPassword, salt);
    next();

});

var User = mongoose.model('User', UserSchema);
module.exports = User;