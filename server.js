var express        = require('express');  
var app            = express();  
var httpServer     = require("http").createServer(app);  
var five           = require("johnny-five");  
var io             = require('socket.io')(httpServer);
var mongoose       = require('mongoose');
var port = 3000; 
 
/*
app.use(express.static(__dirname + '/public'));
 
app.get('/', function(req, res) {  
        res.sendFile(__dirname + '/public/index.html');
});
*/

mongoose.connect('mongodb://localhost/data/db', function(err) {
  if (err) { throw err; }
});

var connexionShema = mongoose.Schema({
    socket_id: String,
    creation_datetime: { type: Date, default: Date.now }
});

var connexion = mongoose.model('connexion', connexionShema);

httpServer.listen(port);  
console.log('Server available at http://localhost:' + port);  
var led;
var ledCurrentAttributes = {};

//Arduino board connection
 
var board = new five.Board();  
board.on("ready", function() {  
    console.log('Arduino connected');
    led = new five.Led(13);

    ledCurrentAttributes.isOn = led.isOn;
    ledCurrentAttributes.brightness = 255;
    ledCurrentAttributes.isBlink = false;        
});
 
//Socket connection handler
io.on('connection', function (socket) {  
        console.log('Socket ID',socket.id);
        var inputConnexion = new connexion({ socket_id: socket.id });
        console.log(inputConnexion);
        inputConnexion.save();
        connexion.find(function (err, conn) {
          if (err) return console.error(err);
          console.log(conn);
        });

        socket.emit('ledState', ledCurrentAttributes);

        socket.on('led:on', function (data) {
            led.fadeIn(1000, function(){
                ledCurrentAttributes.isOn = led.isOn;
                socket.emit('ledState', ledCurrentAttributes);
                socket.broadcast.emit('ledState', ledCurrentAttributes);
            });
        });

        socket.on('led:off', function (data) {
            led.stop();
            led.fadeOut(1000, function(){
            ledCurrentAttributes.isOn = led.isOn;
            ledCurrentAttributes.brightness = 255;
            ledCurrentAttributes.isBlink = false;
                socket.emit('ledState', ledCurrentAttributes);
                socket.broadcast.emit('ledState', ledCurrentAttributes);
            });
        });

        socket.on('led-brightness', function (data) {
            led.fade(parseInt(data.value), 500);
            ledCurrentAttributes.brightness = data.value;
            socket.broadcast.emit('ledState', ledCurrentAttributes);
        });

        socket.on('led-blink:on', function (data) {
            led.strobe(500);
            ledCurrentAttributes.isBlink = true;
            socket.broadcast.emit('ledState', ledCurrentAttributes);
        });

        socket.on('led-blink:off', function (data) {
            led.stop();
            ledCurrentAttributes.isBlink = false;
            socket.broadcast.emit('ledState', ledCurrentAttributes);
        });
});
 
console.log('Waiting for connection');
