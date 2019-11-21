var express = require('express'),
    fs = require('fs'),
    path = require('path'),
    request = require('request'),
    cheerio = require('cheerio'),
    app = express(),
    bodyParser = require('body-parser'),
    env  = process.env;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'www')));
for(let i=0; i<3; i++){
    //make a new request to the URL provided in the HTTP POST request
    request(`https://www.chrono24.com/rolex/`, function (error, response, responseHtml) {
        let resObj = {};

        //if there was an error
        if (error) {
            console.log('There was an error of some kind');
            return;
        }

        //create the cheerio object
        // resObj = {},
            //set a reference to the document that came back
            let $ = cheerio.load(responseHtml);
            let $href = $('.article-item-container a').attr('href');

        if ($href) {

            request(`https://www.chrono24.com/rolex/${$href}`, function (error, response, responseHtml) {
                if (error) {
                    console.log('There was an error of some kind', error);
                    return;
                }
                let $prod = cheerio.load(responseHtml);
                let $prodTitle = $prod('head title').text();
                let $prodInfo= $prod('td strong').text();
                let arr=[]
                if($prodInfo)
                  arr.push($prodInfo)
                console.log(arr)
                // if($prodInfo==='Reference number') {
                //
                //     console.log($prodTitle, $prodInfo)
                // }
                //create a reference to the meta elements
                // $title = $('head title').text(),
                // resObj.title = $title;
            })
        }

    }) ;
};

//listen for an HTTP request
app.listen(env.NODE_PORT || 3000, env.NODE_IP || 'localhost');

//just so we know the server is running
console.log('Navigate your brower to: http://localhost:3000');