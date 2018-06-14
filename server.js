const express = require('express');
const app = express();
const server = app.listen(3000);
const request = require('request');
const moment = require('moment');
const bodyParser = require('body-parser');
const fs = require('fs');


app.use(bodyParser.urlencoded({extended: true}));

// change to own directory location
const logFile = 'C:/Users/cxpta/Documents/VSC Projects/AutloServer/debug.log';

const STATUS_OK = 'LOG';
const STATUS_WARN = 'WARN';
const STATUS_ERROR = 'ERROR';

function log(message = '', statusCode = STATUS_OK) {

    const date = moment().format('YYYY-MM-DD h:mm:ss');
    console.log(`${date} ${statusCode} :: ${message}`)
    fs.appendFileSync(logFile, `${date} ${statusCode} :: ${message}\n`, (err) => {
        if(err) {
            return console.log(err);
        }
    
        console.log("The file was saved!");
    }); 
}

console.log('Server has started..');

function fetchLocationData() {

    return new Promise((resolve, reject) => {

        request('http://188.166.115.129:4545/data.json', function (error, response, body) {
    if (response && response.statusCode !== 200) {

        log(`Data could not be fetched from: http://188.166.115.129:4545/data.json ${JSON.stringify(error)}`, STATUS_ERROR);
          reject('Data could not be fetched from: http://188.166.115.129:4545/data.json', error); // Print the error if one occurred
    }

    log('Data was successfully fetched from http://188.166.115.129:4545/data.json')
        resolve(JSON.parse(body));
     });
    });
}

app.get('/', function(req, res){

    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    log(`New connection from ${ip}`);
    res.sendFile(`${__dirname}/index.html`);
});

app.post('/time', function(req, res){
    const requestedTime = req.body.time;

    fetchLocationData().then((locationObjects) => {
        

        const filteredLocationObjects = locationObjects.filter(object => {
            
            const dateCreated = moment(object.date_created).unix();
            const dateDisabled = moment(object.date_disabled).unix();

            return(dateCreated <= requestedTime && dateDisabled > requestedTime)
        });
        res.send(JSON.stringify(filteredLocationObjects));
    });

});

app.post('/distance', function(req, res){
    // Holds both points lat and lng data
    const point1 = req.body.point1;
    const point2 = req.body.point2;
    // Calculate distance logic here
    let result = getDistanceFromLatLonInKm(point1.lat, point1.lng, point2.lat, point2.lng);

    function distResult(res){
        console.log("The distance between both points is " + result);
    };

    distResult(result);
    
    function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2-lat1);  // deg2rad below
        var dLon = deg2rad(lon2-lon1); 
        var a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
          Math.sin(dLon/2) * Math.sin(dLon/2)
          ; 
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        var d = R * c; // Distance in km
        return d;
      }
      
      function deg2rad(deg) {
        return deg * (Math.PI/180)
      }

      log('Distance was successfully calculated.');


      res.send(JSON.stringify(result));
      
});