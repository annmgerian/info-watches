const express = require('express'),
    fs = require('fs'),
    path = require('path'),
    fastCsv = require('fast-csv'),
    request = require('request'),
    cheerio = require('cheerio'),
    app = express(),
    env = process.env;
const ws = fs.createWriteStream("data.csv");


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
    WebsiteName: 'Chrono24',
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
    Description: '',
    Other: ''
};

app.use(express.static(path.join(__dirname, 'www')));
const startLink = 'https://www.chrono24.com/rolex/';
let interval = 10;
//make a new request to the URL provided in the HTTP POST request
let table = [];
for(let k=1; k<7; k++) {
    request(`https://www.chrono24.com/rolex/index-${k}.htm`, function (error, response, responseHtml) {
        //if there was an error
        if (error) {
            console.log('There was an error of some kind');
            return;
        }
        //create the cheerio object
        //set a reference to the document that came back
        let $ = cheerio.load(responseHtml);
        $('.article-item-container a').each(function (i, e) {
                if (table.length !== 200) {
                    let $href = $(e).attr('href');
                    let fullLink = startLink + $href;
                    setTimeout(function () {
                        request(fullLink, async function (error, response, responseHtml) {
                                if (error) {
                                    console.log('There was an error of some kind', error);
                                    return;
                                }
                                let $prod = cheerio.load(responseHtml);
                                let obj = {...fields};
                                obj['WatchLink'] = fullLink;
                                var name = '';
                                $prod('td strong').each(function (i, e) {
                                    let parentEl;
                                    switch ($(e).text()) {
                                        case 'Reference number':
                                            parentEl = $(e).parent().parent();
                                            obj['ReferenceNumber'] = parentEl.children().last().text();
                                            break;
                                        case 'Brand':
                                            parentEl = $(e).parent().parent();
                                            name += parentEl.children().last().text();
                                            obj['BrandName'] = parentEl.children().last().text();
                                            break;
                                        case 'Model':
                                            parentEl = $(e).parent().parent();
                                            name += ' ' + parentEl.children().last().text();
                                            obj['WatchModel'] = parentEl.children().last().text().replace(/[!?,;:'"-]/g, '.').toLowerCase();
                                            break;
                                        case 'Movement':
                                            parentEl = $(e).parent().parent();
                                            obj['Movement'] = parentEl.children().last().text();
                                            break;
                                        case 'Gender':
                                            parentEl = $(e).parent().parent();
                                            const regexU = /[U]/g;
                                            const regexW = /[W]/g;
                                            let sex = parentEl.children().last().text();
                                            if (sex.match(regexU))
                                                obj['Gender'] = "U";
                                            else if (sex.match(regexW))
                                                obj['Gender'] = "W";
                                            else
                                                obj['Gender'] = "M";
                                            break;
                                        case 'Power reserve':
                                            parentEl = $(e).parent().parent();
                                            let reserve = parentEl.children().last().text();
                                            let reservePhrases = reserve.split(' ');
                                            obj['PowerReserve'] = Number(reservePhrases[0]);
                                            break;
                                        case 'Number of jewels':
                                            parentEl = $(e).parent().parent();
                                            obj['NumberOfJewels'] = Number(parentEl.children().last().text());
                                            break;
                                        case 'Case diameter':
                                            parentEl = $(e).parent().parent();
                                            let diameter = parentEl.children().last().text();
                                            let diameterPhrases = diameter.split(' ');
                                            obj['CaseDiameter'] = Number(diameterPhrases[0]);
                                            break;
                                        case 'Case material':
                                            parentEl = $(e).parent().parent();
                                            obj['CaseMaterial'] = parentEl.children().last().text();
                                            break;
                                        case 'Water resistance':
                                            parentEl = $(e).parent().parent();
                                            let resistance = parentEl.children().last().text();
                                            let resistancePhrases = resistance.split(' ');
                                            const regexNonDigit = /\D/g;
                                            const regexDot = /[.]/g;
                                            resistancePhrases.forEach((element) => {

                                                if (!element.match(regexNonDigit) || element.match(regexDot)) {
                                                    obj['WaterResistanceAtm'] = Math.round(Number(element));
                                                }
                                            });
                                            break;
                                        case 'Bezel material':
                                            parentEl = $(e).parent().parent();
                                            obj['BezelMaterial'] = parentEl.children().last().text();
                                            break;
                                        case 'Glass':
                                            parentEl = $(e).parent().parent();
                                            obj['Glass'] = parentEl.children().last().text();
                                            break;
                                        case 'Dial':
                                            parentEl = $(e).parent().parent();
                                            obj['DialColor'] = parentEl.children().last().text();
                                            break;
                                        case 'Bracelet material':
                                            parentEl = $(e).parent().parent();
                                            obj['BraceletMaterial'] = parentEl.children().last().text();
                                            break;
                                        case 'Bracelet color':
                                            parentEl = $(e).parent().parent();
                                            obj['BraceletColor'] = parentEl.children().last().text();
                                            break;
                                        case 'Condition':
                                            parentEl = $(e).parent().parent();
                                            const regexNew = /New/g;
                                            if (parentEl.children().last().text().match(regexNew))
                                                obj['Condition'] = 'New';
                                            obj['Condition'] = 'Preowned';
                                            break;
                                        case 'Scope of delivery':
                                            parentEl = $(e).parent().parent();
                                            let delivery = parentEl.children().last().text();
                                            let deliveryPhrases = delivery.split(',');
                                            const regexNo = /no/gi;
                                            const regexBox = /box/gi;
                                            deliveryPhrases.forEach((element) => {
                                                    if (!element.match(regexNo) && element.match(regexBox)) {
                                                        if (obj['ScopeOfDelivery'].length === 0)
                                                            obj['ScopeOfDelivery'] += 'Box included and ';
                                                        else
                                                            obj['ScopeOfDelivery'] += 'box included';
                                                    } else if (element.match(regexNo) && element.match(regexBox)) {
                                                        if (obj['ScopeOfDelivery'].length === 0)
                                                            obj['ScopeOfDelivery'] += 'Box not included and ';
                                                        else
                                                            obj['ScopeOfDelivery'] += 'box not included';
                                                    } else if (!element.match(regexNo) && !element.match(regexBox)) {
                                                        if (obj['ScopeOfDelivery'].length === 0)
                                                            obj['ScopeOfDelivery'] += 'Papers included and ';
                                                        else
                                                            obj['ScopeOfDelivery'] += 'papers included';
                                                    } else {
                                                        if (obj['ScopeOfDelivery'].length === 0)
                                                            obj['ScopeOfDelivery'] += 'Papers not included and ';
                                                        else
                                                            obj['ScopeOfDelivery'] += 'papers not included';
                                                    }
                                                }
                                            );
                                            break;
                                        case 'Location':
                                            parentEl = $(e).parent().parent();
                                            let location = parentEl.children().last().text();
                                            let locationPhrases = location.split(',');
                                            obj['Location'] = locationPhrases[0];
                                            break;
                                        case 'Year':
                                            parentEl = $(e).parent().parent();
                                            let year = parentEl.children().last().text();
                                            let yearPhrases = year.split(' ');
                                            obj['Year'] = yearPhrases[0];
                                            break;
                                    }
                                });
                                let price = $prod('.price-lg span span').text().replace(/,/g, '.');
                                let cleanPrice = price.replace(/[$]/g, '');
                                if (Number(cleanPrice) !== 'NaN')
                                    obj['Price'] = Number(cleanPrice);
                                obj['Currency'] = 'USD';
                                obj['Description'] = $prod('#watchNotes').text();
                                obj['WatchImage'] = $prod('.detail-image div div').attr('data-original');
                                name += ' ' + obj['ReferenceNumber'];
                                obj['WatchName'] = name;
                                if (obj['ReferenceNumber'] !== '' && obj['WatchModel'] !== '' && obj['BrandName'] !== '' && obj['Condition'] !== '' && obj['Location'] !== '' && obj['Price'] !== 'NaN') {
                                    table.push(obj);
                                    if (table.length === 200) {
                                        await fastCsv
                                            .write([...table], {headers: true})
                                            .pipe(ws);
                                        await console.log('done')
                                    }
                                }
                            }
                        )
                    }, interval)
                }
        })
    })
}

//listen for an HTTP request
app.listen(env.NODE_PORT || 3000, env.NODE_IP || 'localhost');

//just so we know the server is running
console.log('Navigate your browser to: http://localhost:3000');