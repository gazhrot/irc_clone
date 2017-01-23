var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    ent = require('ent'), // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)
    fs = require('fs');

// Chargement de la page index.html
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

io.sockets.on('connection', function (socket, pseudo) {
    // Dès qu'on nous donne un pseudo, on le stocke en variable de session et on informe les autres personnes
    //console.log(socket.id);
    socket.on('nouveau_client', function(pseudo) {
        pseudo = ent.encode(pseudo);
        socket.pseudo = pseudo;
        socket.broadcast.emit('nouveau_client', pseudo);
    });

    socket.on('room', function(room, pseudo) {
        socket.emit('joined_room', pseudo, room);
        socket.join(room);
        console.log(room,pseudo);
    });

    // Dès qu'on reçoit un message, on récupère le pseudo de son auteur et on le transmet aux autres personnes
    socket.on('message', function (message, room) {
        console.log(socket.rooms);
        message = ent.encode(message);
        io.sockets.in(room).emit('message', {pseudo: socket.pseudo, message: message, room: room});
        //socket.broadcast.emit('message', {pseudo: socket.pseudo, message: message});
    }); 
});

server.listen(3000);