'use strict';

// Auth Middleware

var User = require('./models/user');
var basicAuth = require('basic-auth');
var bcrypt = require('bcrypt');

var auth = function (req, res, next) {

    // parse the credentials
    var user = basicAuth(req);

    function unauthorised(res) {
        return res.sendStatus(401);
    }

    if (!user || !user.name || !user.pass) {
        return unauthorised(res);
    } else {
        // Find the user in the database based on the email address
        User.findOne({emailAddress: user.name}, function(err, email){
            if (err) {
                return next(err);
            }
            if (email) {
                if (bcrypt.compareSync(user.pass, email.password)){
                    req.user = email;
                    return next();
                } else {
                    return unauthorised(res);
                }
            } else {
                return unauthorised(res);
            }
        })
    }
};

module.exports = auth;