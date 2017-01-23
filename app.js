var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    ent = require('ent'), // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)
    fs = require('fs');

// Chargement de la page index.html
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

var current_room;

io.sockets.on('connection', function (socket, pseudo) {
    // Dès qu'on nous donne un pseudo, on le stocke en variable de session et on informe les autres personnes
    //console.log(socket.id);
    socket.on('nouveau_client', function(pseudo) {
        pseudo = ent.encode(pseudo);
        socket.pseudo = pseudo;
        socket.broadcast.emit('nouveau_client', pseudo);
    });

    socket.on('room', function(room, pseudo) {
        current_room = room;
        socket.join(room);
        socket.emit('joined_room', pseudo, room);
        console.log(current_room,pseudo);
    });

    // Dès qu'on reçoit un message, on récupère le pseudo de son auteur et on le transmet aux autres personnes
    socket.on('message', function (message, room) {
        console.log(socket.rooms);

        console.log('room : ', current_room);
        message = ent.encode(message);
        socket.to(current_room).emit('message', {pseudo: socket.pseudo, message: message});
        //io.sockets.in(room).emit('message', {pseudo: socket.pseudo, message: message, room: room});
        //socket.broadcast.emit('message', {pseudo: socket.pseudo, message: message});
    });
});

server.listen(3000);