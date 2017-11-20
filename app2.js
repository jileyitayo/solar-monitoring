var express = require('express'),
    debug = true,
    http = require('http'),
    _ = require('underscore'),
    server = express(),
    port = 3000,
    api_host = 'https://api.thingspeak.com';
    // api_host = 'api.acme.local',
    io = require('socket.io').listen(server.listen(port));


console.log('Node server listening on port', port);

// server
//     .get('/', function(req, res){
//          res.sendfile('index.html');
//     });

var clients = {};

io.sockets.on('connection', function(socket) {
    console.log('jil');
    console.log('Client ' + socket.id + ' is connected');

    // Add the client to the list of connected clients
    clients[socket.id] = true;

    // // Broadcast to everyone the list of connected clients
    // io.sockets.emit('connected_clients', _.size(clients));

    // Send the current positions to the connected client when client is ready
    socket.on('ready', function() {
        getField(function(data){
            console.log('Send locations to client ' + socket.id);
            socket.emit('output', data);
        });
    });

    // When a client is disconnecting, inform other clients
    socket.on('disconnect', function() {
        delete clients[socket.id];
        console.log('Client "' + socket.id + '" disconnected');
        io.sockets.emit('connected_clients', _.size(clients));
    });
});

// Update locations every minutes
setInterval(function()
{
    // Do nothing if there is no client
    if (_.size(clients) == 0) {
        return;
    }

    console.log('Update positions...');

    // Get the current courses and broadcast them to all clients
    getField(function(data){
        io.sockets.emit('output', data);
    });
}, 5000); // every minute

// Update the server date every seconds
setInterval(function(){
    io.sockets.emit('date', {'date': new Date()});
}, 1000);

function getField(callback) {

    return http.get({
        host: api_host,
        path: '/channels/352869/feeds.json?api_key=LZ3HRKIS2A6FCS3I&results=2'
    }, function(response) {
        // Continuously update stream with data
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {

            // Data reception is done, do whatever with it!
            var parsed = JSON.parse(body);
            console.log(body);
            console.log(parsed);
            callback({
                feed: parsed.feeds[0].field1,
                feeds: parsed.feeds
            });
        });
    });

}


function getFields(callback)
{
    var options = {
        hostname: api_host,
        port: 80,
        path: '/channels/352869/feeds.json?api_key=LZ3HRKIS2A6FCS3I&results=2',
        method: 'GET'
    };

    var req = http.request(options, function(res) {
        //console.log('-----------------------------------------');
        //console.log('STATUS: ' + res.statusCode);
        //console.log('HEADERS: ' + JSON.stringify(res.headers));
        var output = '';

        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            output += chunk;
            console.log(output);
        });

        res.on('end', function() {
            var obj = JSON.parse(output);
            console.log(output);
            if (callback != undefined){
                callback(obj);
            }
        });
    });

    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    req.end();
}



const axios = require('axios');
const client = require('socket.io').listen(3000).sockets;

//connect to sockey.io
client.on('connection', function(socket){
     console.log('Connected Successfully ');

    // create function to send status to client from server
    sendValues = function(s){
        socket.emit('values', s);
    }

    // Send the current positions to the connected client when client is ready
    socket.on('ready', function() {
        fetchdata(function(data){
            console.log('Data collected ' + data);
            socket.emit('output', data);
        });
    });
});

// Update locations every minutes
setInterval(function()
{
    console.log('Updating...');

    // Get the current courses and broadcast them to all clients
    fetchdata(function(data){
        console.log(data);
        client.emit('output', data);
    });
}, 3000); // every minute

// Update the server date every seconds
setInterval(function(){
    client.emit('date', {'date': new Date()});
}, 3000);


var fetchdata = function(callback){
    //get data from api
    axios.get('https://api.thingspeak.com/channels/352869/feeds.json?api_key=LZ3HRKIS2A6FCS3I&results=2')
      .then(response => {
        console.log(response.data.feeds[0].field1);
        var obj = response.data.feeds[0];
        if (callback != undefined){
            callback(obj);
        }
      }).catch(error => {
        console.log(error);
      });
  }

