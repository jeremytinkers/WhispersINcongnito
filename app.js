//jshint esversion:6

const express=require('express');
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose= require("mongoose");
const session = require('express-session')
const passport= require("passport");
const passportLocalMongoose= require("passport-local-mongoose");


const saltRounds = 10;
// var encrypt= require('mongoose-encryption');

const app= express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', "ejs");

app.use(session({
  secret: 'abracadabara',
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.set('useCreateIndex', true);
mongoose.connect('mongodb://localhost:27017/whispersDB', {useNewUrlParser: true, useUnifiedTopology: true});


var userSchema = new mongoose.Schema({
  email: String ,password:String
  });//Schema

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

app.get('/', function(req, res){
  console.log("Root get request made");
  res.redirect("/home");
})

app.get("/home", function(req, res){

  res.render('home');
})

app.get("/login", function(req, res){

  res.render('login');
})

app.get("/secrets", function(req,res){
  console.log(req.isAuthenticated());
if(req.isAuthenticated())
{res.render("secrets");
console.log("Has been authenticated");}
else
res.redirect("/login");
})

app.post("/register", function(req, res){

User.register({username:req.body.username}, req.body.password, function(err,user){
if(!err)
{
  passport.authenticate("local")(req,res,function(){
  res.redirect("/secrets");
  })
}else
{
  console.log(err);
  res.redirect("/register");
}

})

})

app.get("/logout", function(req,res){

  req.logout(function(err){
    if(err)
    console.log(err);
  });
  res.redirect("/");
})

app.post("/login", function(req, res){

const user1 = new User({
  email: req.body.username ,password:req.body.password
});

req.login(user1, function(err){
  if(!err){
    passport.authenticate("local")(req,res,function(){
      res.redirect("/secrets");
    })
  }else
  {
    console.log(err);
    res.redirect("/login");}

})

  });


app.get("/register", function(req, res){

  res.render('register');
})

app.listen(3000,function(req,res){

console.log("Server listening on port 3000");

})
