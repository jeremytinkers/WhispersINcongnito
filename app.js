//jshint esversion:6

const express=require('express');
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose= require("mongoose");
const md5= require("md5");
require("dotenv").config();
var encrypt= require('mongoose-encryption');

const app= express();

app.get('/', function(req, res){
  console.log("Root get request made");
})

mongoose.connect('mongodb://localhost:27017/whispersDB', {useNewUrlParser: true, useUnifiedTopology: true});

var userSchema = new mongoose.Schema({
  email: String ,password:String
  });//Schema


userSchema.plugin(encrypt, { secret: process.env.SECRETKEY , encryptedFields: ['password']});

const User = mongoose.model('User', userSchema);
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', "ejs");

app.get("/home", function(req, res){

  res.render('home');
})

app.get("/login", function(req, res){

  res.render('login');
})

app.post("/register", function(req, res){

var email1=req.body.username;
var password1=md5(req.body.password);

const user1 = new User({
  email:email1, password:password1
});
user1.save(function(err){
  if(!err)
  res.render("secrets");
  else
  console.log(err);
});


})

app.post("/login", function(req, res){

var email1=req.body.username;
var password1=md5(req.body.password);

User.findOne({email:email1}, function(err,data){
console.log(data);
if(!err)
if (data != null && data.length != 0)
{
  if(data.password===password1)
  res.render("secrets");
  else
  console.log("Not a match");
}

else
console.log(err);

})

})

app.get("/register", function(req, res){

  res.render('register');
})

app.listen(3000,function(req,res){

console.log("Server listening on port 3000");

})
