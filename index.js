require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dns = require("dns")


const port = process.env.PORT || 3000;
// Connecting to the mongo db.
let uri ="mongodb+srv://mongodbMaster:mongodb115@cluster0.iasnm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true});
// If the output is 2, then this means you are successfully connected.
console.log(mongoose.connection.readyState);

let urlSchema = new mongoose.Schema({
  original: {type: String, required: true},
  short: Number});

let Url = mongoose.model('Url', urlSchema);

app.use('/public', express.static(`${process.cwd()}/public`));
app.use(cors());

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

let responseObject = {};

app.post('/api/shorturl', bodyParser.urlencoded({extended: false}), function(req,res){

  console.log(req.body);
  console.log(req.url);
  console.log(req.body.url);

  //let inputUrl = req.body['url'];
  let inputUrl = req.body.url;

  // Conditional to match the http:// or https:// syntax.
  let urlRegex = new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi);
  if(!inputUrl.match(urlRegex)){
    res.json({error: 'Invalid URL'});
	  return;
  }

  responseObject['original_url'] = inputUrl;

  let inputShort = 1;
  
  Url.findOne({})
    .sort({short: 'desc'})
    .exec((error, result) => {
      if(!error && result != undefined){
        inputShort = result.short + 1;
      }
      if(!error)
      {
        Url.findOneAndUpdate(
          {original: inputUrl}, 
          {original: inputUrl, short: inputShort},
          {new: true, upsert: true, useFindAndModify: false},
          (error, savedUrl) => {
            if(!error){
              responseObject['short_url'] = savedUrl.short;
              res.json(responseObject);
            }
          })
      }
    })
});

app.get('/api/shorturl/:input', (request, response) => {
  let input = request.params.input;
  
  Url.findOne({short: input}, (error, result) => {
    if(!error && result != undefined){
      // Redirects you to the page.
      response.redirect(result.original);
    }else{
      response.json({error: 'URL not Found'});
    }
  })
})