require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose=require("mongoose");
const session= require("express-session");
const passport= require("passport");
const passportLocalMongoose= require("passport-local-mongoose");
//add this
const GoogleStrategy=require("passport-google-oauth20");
const findOrCreate=require("mongoose-findorcreate");
const axios= require("axios");
const cheerio= require("cheerio");
const nodemailer = require('nodemailer');
const {google}= require("googleapis");
const { OAuth2Client } = require("google-auth-library");
//const find=require(__dirname+"find.js");

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: 'Our little secret.',
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");
const linkPriceSchema=mongoose.Schema({
    link:String,
    price:String,
    availability:String
})
const userSchema= mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    links:[{type:linkPriceSchema}]
});



userSchema.plugin(passportLocalMongoose);
//added this
userSchema.plugin(findOrCreate);

const User= mongoose.model("User",userSchema); 
const linkPrice= mongoose.model("linkPrice",linkPriceSchema); 

passport.use(User.createStrategy());

//******************start here**************** */
passport.serializeUser(function(user,done){
    done(null,user.id);
});
passport.deserializeUser(function(id,done){
    User.findById(id,function(err,user){
        done(err,user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/alllinks",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    //console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
//*********************till here**************** */

app.get("/alllinks", function(req,res){
    if(req.isAuthenticated())
    {
        User.findById(req.user.id,function(err,foundUser){
        if(err){
            console.log(err);
        }
        else
        {
            if(foundUser)
            {
                console.log(foundUser);
                res.render("alllinks",{amazonLinks: foundUser});
            }
        }
    });
    }
    else
    res.redirect("/login");
});

// *****************add this*********************
app.get("/auth/google", 
    passport.authenticate('google',{scope: ["profile"]})
);
app.get("/auth/google/alllinks", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/alllinks');
  });

app.get("/submit",function(req,res){
    if(req.isAuthenticated())
    res.render("submit");
    else
    res.redirect("/login");
});

app.post("/submit", function(req,res){
    const newLink= req.body.link;
    User.findById(req.user.id,function(err,foundUser){
        if(err)
        console.log(err);
        else
        {
            if(foundUser)
            {
                newl= new linkPrice({
                    link:newLink,
                    price:10000000,
                    availability:"Not Available"
                });
                foundUser.links.push(newl);
                //console.log(foundUser.links);
                foundUser.save(function(){
                    res.redirect("/alllinks");
                });
            }
        }
    });
});
//******************till here******************* 

app.post("/register",function(req,res){
    //************************add this************** */
    User.register({username:req.body.username},req.body.password,function(err,user){
     if(err)
     {
         console.log(err);
         req.redirect("/register");
     }
     else{
             passport.authenticate("local")(req,res,function(){
             res.redirect("/alllinks");
            });
     }
    });
    //***************till here********************** */
 });
 
 app.post("/login",function(req,res){
     //*********************start here**************** */
     const user= new User({
         username:req.body.username,
         password:req.body.password
     });
 
     req.login(user, function(err){
         if(err)
         console.log(err);
         else
         {
             passport.authenticate("local")(req,res,function(){
                 res.redirect("/alllinks");
             });
         }
         
     });
     //***********************till here************* */
 });

 app.post("/delete",function(req,res){
    User.findOne({id:req.body.id},function(err,results)
    {
      if(!err)
      {
        //console.log(results.links);
        results.links.splice(req.body.linkno,1);
        results.save();
        res.redirect("/alllinks");
      }
    });
 });

app.get("/logout",function(req,res){
    req.logOut(function(err){
        if(err)
        console.log(err);
        else
        res.redirect("/");
    });
    
});

app.get("/",function(req,res){
    res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.listen(3000,function(){
    console.log("Connected");
});





const SomeFunction = (newPrice,oldPrice,userLink,userEmail) => {
    const googleOauth2= new google.auth.OAuth2(process.env.CLIENT_EMAIL,process.env.CLIENT_SECRET_EMAIL);
    googleOauth2.setCredentials({refresh_token:process.env.REFRESH_TOKEN})
    async function sendMail(){
        try {
            const accessToken1= await googleOauth2.getAccessToken();
            const transport = nodemailer.createTransport({
                service:'gmail',
                auth: {
                type:"OAuth2",
                user:"kartiksangwan10@gmail.com",
                clientID: process.env.CLIENT_EMAIL,
                clientSecret: process.env.CLIENT_SECRET_EMAIL,
                refreshToken:process.env.REFRESH_TOKEN,
                accessToken:"ya29.A0AVA9y1tyIT4qYfFEH0-_i0ycQ6pbjE1mlHVpiFddl6Ix1WlpUcPmA9uKst43cPmTTmnQiy1yYBUmL_FK6jhzVtBMgruGsiYWnpxjdbemRZHXQaERIzzdu9WAAc1e2TzFShA_fXod1uqReQ1hO3VYToXoGaCkrwYUNnWUtBVEFTQVRBU0ZRRTY1ZHI4R041YloyTE1xNmJiSEZGY1NIT29LUQ0165"
                }
            });
            console.log(userEmail);
            const mailOptions={
                from:"<kartiksangwan10@gmail.com>",
                to:userEmail,
                subject:"PRICE DROP ALERT",
                text:"The price for your product "+userLink+" has dropped from "+oldPrice+" to "+newPrice+". Shop now!!"
            }
            const result=await transport.sendMail(mailOptions);
            return result
        } catch (error) {
            return error
        }
    };
    sendMail().then(result=>console.log("MAIL SENT",result)).catch(error=>console.log(error));
};
  
  async function FetchPrice(productUrl){
      try {
        var price=0;
        let data=await axios
        .get(productUrl, {
            headers: {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36"
            },
            });
            data=data.data;
            const $ = cheerio.load(data);
            let gotThePrice = $(".a-price-whole").text();
            gotThePrice= gotThePrice.split(".");
            const priceList = gotThePrice[0].match(/\d+/g);
            var final="";
            priceList.forEach(function(price){
            final+=price;
            });     
            price = Number(final);
            return price;
        } catch (error) {
            console.log(error);
            throw error;
      }
  };
  
  function Track(){
      User.find({links:{$ne:null}},function(err,foundUser){
      if(err){
          console.log(err);
      }
      else
      {
          if(foundUser)
          {
                foundUser.forEach(function(user){
                user.links.forEach(async function(link){
                    try {
                        var ans= await FetchPrice(link.link);
                        if(ans<link.price)
                        {
                            SomeFunction(ans,link.price,link.link,user.username);
                            link.availability="Available";
                            //console.log(link.link)
                            link.price=ans;
                            user.save();
                        }
                    } catch (error) {
                        console.log(error);
                    }
                  
                });
              });
          }
      }
    });
    setTimeout(Track, 6000);
  };
  
  Track();
  