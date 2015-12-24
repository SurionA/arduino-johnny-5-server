var express        = require('express');  
var app            = express();  
var httpServer = require("http").createServer(app);  
var five = require("johnny-five");  
var io=require('socket.io')(httpServer);
 
var port = 3000; 
 
/*
app.use(express.static(__dirname + '/public'));
 
app.get('/', function(req, res) {  
        res.sendFile(__dirname + '/public/index.html');
});
*/
httpServer.listen(port);  
console.log('Server available at http://localhost:' + port);  
var on, off, arduino;


//Arduino board connection
 
var board = new five.Board();  
board.on("ready", function() {  
    console.log('Arduino connected');
    this.pinMode(9, five.Pin.PWM);
    this.pinMode(10, five.Pin.PWM);
    on = 9;
    off = 10;
    arduino = this;
});
 
//Socket connection handler
io.on('connection', function (socket) {  
        console.log('Socket ID',socket.id);
        socket.emit('init:motor');
        socket.on('motor:on', function (data) {
            arduino.analogWrite(on, 255);
            arduino.analogWrite(off, 0); 
        });

        socket.on('motor:off', function (data) {
            arduino.analogWrite(on, 0);
            arduino.analogWrite(off, 0); 
        });

        socket.on('motor:left', function (data) {
            on = 9;
            off = 10;
            arduino.analogWrite(on, 255);
            arduino.analogWrite(off, 0); 
        });

        socket.on('motor:right', function (data) {
            on = 10;
            off = 9;
            arduino.analogWrite(on, 255);
            arduino.analogWrite(off, 0); 
        });

        socket.on('motor:speed', function (data) {
            arduino.analogWrite(on, parseInt(data.value));
            arduino.analogWrite(off, 0); 
        });
});
 
console.log('Waiting for connection');
