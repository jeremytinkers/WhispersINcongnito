//jshint esversion:6
const express = require('express');
require("dotenv").config();
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require('express-session')
const passport = require("passport");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const passportLocalMongoose = require("passport-local-mongoose");
const saltRounds = 10;

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set('view engine', "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set('view engine', "ejs");

app.use(session({
    secret: 'abracadabara',
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.set('useCreateIndex', true);
mongoose.connect('mongodb://localhost:27017/whispersDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});


var userSchema = new mongoose.Schema({
    email: String,
    password: String,
    secret: String
}); //Schema

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});


//creating new google strategy to implemetn OAuth2 google
passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
    },
    function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({
            googleId: profile.id
        }, function(err, user) {
            return cb(err, user);
        });
    }
));

app.get('/auth/google',
    passport.authenticate('google', {
        scope: ['profile']
    })); //google authenticate

app.get('/auth/google/secrets',
    passport.authenticate('google', {
        failureRedirect: '/login'
    }), //locally authenticate
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });

app.get('/', function(req, res) {
    console.log("Root get request made");
    res.redirect("/home");
})

app.get("/home", function(req, res) {

    res.render('home');
})

app.get("/login", function(req, res) {

    res.render('login');
})

app.get("/secrets", function(req, res) {

    User.find({
        "secret": {
            $ne: null
        }
    }, function(err, foundUsers) {
        if (!err) {
            if (foundUsers.length != 0 && foundUsers != null) {
                res.render("secrets", {
                    secretlist_ejs: foundUsers
                });
            } else {
                console.log("No secrets have been found!");
            }
        } else {
            console.log(err);
        }

    })

})

app.post("/register", function(req, res) {

    User.register({
        username: req.body.username
    }, req.body.password, function(err, user) {
        if (!err) {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            })
        } else {
            console.log(err);
            res.redirect("/register");
        }

    })

})

app.get("/submit", function(req, res) {
    if (req.isAuthenticated())
        res.render("submit");
    else
        res.redirect("/login");

})

app.post("/submit", function(req, res) {

    var enteredsecret = req.body.secret;
    console.log(req.user);
    User.findById(req.user._id, function(err, foundUser) {
        if (!err) {
            if (foundUser != null && foundUser.length != 0) {
                foundUser.secret = enteredsecret;
                foundUser.save(function(err) {
                    if (!err) {
                        console.log("Secret has been submitted successfully");
                        res.redirect("/secrets");
                    } else
                        console.log(err);
                })
            }
        }
    })


})

app.get("/logout", function(req, res) {

    req.logout(function(err) {
        if (err)
            console.log(err);
    });
    res.redirect("/");
})

app.post("/login", function(req, res) {

    const user1 = new User({
        email: req.body.username,
        password: req.body.password
    });

    req.login(user1, function(err) {
        if (!err) {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            })
        } else {
            console.log(err);
            res.redirect("/login");
        }

    })

});


app.get("/register", function(req, res) {

    res.render('register');
})

app.listen(3000, function(req, res) {

    console.log("Server listening on port 3000");

})
