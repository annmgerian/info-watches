const express = require('express'),
    fs = require('fs'),
    path = require('path'),
    // fastcsv = require('fast-csv'),
    request = require('request'),
    cheerio = require('cheerio'),
    app = express(),
    env = process.env;
// const ws = fs.createWriteStream("data.csv");


const fields = {
    ReferenceNumber: '',
    WatchName: '',
    Gender: '',
    Location: '',
    Price: '',
    Currency: '',
    BrandName: '',
    Condition: '',
    ScopeOfDelivery: '',
    WatchLink: '',
    WatchImage: '',
    WebsiteName: '',
    WatchModel: '',
    Year: '',
    Movement: '',
    PowerReserve: '',
    NumberOfJewels: '',
    CaseDiameter: '',
    CaseMaterial: '',
    WaterResistanceAtm: '',
    BezelMaterial: '',
    Glass: '',
    DialColor: '',
    BraceletMaterial: '',
    BraceletColor: '',
    Buckle: '',
    BuckleMaterial: '',
    Functions: '',
    Desciption: '',
    Other: ''
};

app.use(express.static(path.join(__dirname, 'www')));
const startLink = 'https://www.chrono24.com/rolex/';
    //make a new request to the URL provided in the HTTP POST request
    request(startLink, function (error, response, responseHtml) {
        let table=[];
        //if there was an error
        if (error) {
            console.log('There was an error of some kind');
            return;
        }
        //create the cheerio object
        //set a reference to the document that came back
        let $ = cheerio.load(responseHtml);
        $('.article-item-container a').each(function (i, e) {
          if(i<4){
              let $href = $(e).attr('href');
              let fullLink = startLink + $href;
              request(fullLink, async function (error, response, responseHtml) {
                  if (error) {
                      console.log('There was an error of some kind', error);
                      return;
                  }
                  let $prod = cheerio.load(responseHtml);
                  let obj = { ...fields };
                  obj['WatchLink'] = fullLink;
                  var name='';
                  $prod('td strong').each(function (i, e) {
                      let parentEl;
                      switch($(e).text()) {
                          case 'Reference number':
                              parentEl = $(e).parent().parent();
                              obj['ReferenceNumber'] = parentEl.children().last().text();
                              break;
                          case 'Brand':
                              parentEl = $(e).parent().parent();
                              name+=parentEl.children().last().text();
                              break;
                          case 'Model':
                              parentEl = $(e).parent().parent();
                              name+=' '+parentEl.children().last().text();
                              // obj['WatchModel']=parentEl.children().last().text().replace(/[!?,;:'"-]/g,'.').toLowerCase();
                              break;
                      }
                  });
                  obj['WatchImage']=$prod('.detail-image div div').attr('data-original');
                  name+=' '+obj['ReferenceNumber'];
                  obj['WatchName'] = name;
                   table.push(obj);
                  if(table.length===4) {
                       fs.readFile("data.json", async (err, buffer) => {
                          if (err) return console.error('File read error: ', err);
                          const data = JSON.parse(buffer.toString());
                           data["table"]=[...table];
                           await fs.writeFile("data.json", JSON.stringify(data), err => {
                              if (err) return console.error('File write error:', err)
                          });
                           await console.log('done')

                          //     fastcsv
                          //         .write(data["table"], {headers: true})
                          //         .pipe(ws);
                      });
                  }
              })
          }
        })
        });

//listen for an HTTP request
app.listen(env.NODE_PORT || 3000, env.NODE_IP || 'localhost');

//just so we know the server is running
console.log('Navigate your browser to: http://localhost:3000');