var express = require('express');
var app = express();
var path = require('path');
var server = require('http').Server(app);
const axios = require('axios');
const client = require('socket.io')(server);

// const client = require('socket.io').listen(3000).sockets;
const dateformat = require('dateformat');

server.listen(80);

app.use(express.static(path.join(__dirname, '/')));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

//connect to sockey.io
client.on('connection', function(socket){
     console.log('Connected Successfully ');
    // Send the current positions to the connected client when client is ready
    socket.on('ready', function() {
        fetchdata(function(data){
            socket.emit('output', data);
        });
    });
});

// Update locations every minutes
setInterval(function()
{
    // console.log('Updating...');
    // Get the current courses and broadcast them to all clients
    fetchdata(function(data){
        client.emit('output', data);
    });
}, 3000); // every minute

// Update the server date every seconds
setInterval(function(){
    var date = new Date();
    client.emit('date', {'date': dateformat(date, 'dddd, mmmm dS, yyyy, h:MM:ss')});
}, 1000);


var fetchdata = function(callback){
    //get data from api
    axios.get('https://api.thingspeak.com/channels/352869/feeds.json?api_key=LZ3HRKIS2A6FCS3I&results=2')
      .then(response => {
        // console.log(response.data.feeds[0].field1);
        var obj = response.data.feeds[1];
        if (callback != undefined){
            callback(obj);
        }
      }).catch(error => {
        // console.log(error);
      });
  }

