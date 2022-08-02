
const axios= require("axios");
const cheerio= require("cheerio");
const mongoose= require("mongoose");


mongoose.connect("mongodb://localhost:27017/userDB");

const SomeFunction = (newPrice) => {
  console.log("wew! go buy nowwww.... the new price is", newPrice);
};

const linkPriceSchema=mongoose.Schema({
  link:String,
  price:String,
  availability:String
});
const userSchema= mongoose.Schema({
  email:String,
  password:String,
  googleId:String,
  links:[{type:linkPriceSchema}]
});

const User= mongoose.model("User",userSchema); 
const linkPrice= mongoose.model("linkPrice",linkPriceSchema); 

async function FetchPrice(productUrl){
    var price=0;
    let data=await axios
    .get(productUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36",
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
                var ans= await FetchPrice(link.link);
                if(ans<link.price)
                {
                  SomeFunction(ans);
                  link.availability="Available";
                }
                link.price=ans;
                user.save();
              });
            });
        }
    }
  });
  setTimeout(Track, 300000);
};

Track();

