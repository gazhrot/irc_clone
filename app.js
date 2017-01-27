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
var users_connected = [];
var channel = [
    'php',
    'js',
    'java'
];
var commands = [
    'nick',
    'list',
    'join',
    'part',
    'users',
    'msg',
    'leave'
    ];


io.sockets.on('connection', function (socket, pseudo) {
    // Dès qu'on nous donne un pseudo, on le stocke en variable de session et on informe les autres personnes
    //console.log(socket.id);
    socket.on('nouveau_client', function(pseudo) {
        pseudo = ent.encode(pseudo);
        socket.pseudo = pseudo;
        users_connected.push({id: socket.id, pseudo: pseudo});
        console.log(users_connected);
        socket.broadcast.emit('nouveau_client', pseudo);
    });

    socket.on('room', function(room, pseudo) {
        current_room = room;
        socket.join(room);
        socket.emit('joined_room', pseudo, room);
        console.log(current_room,pseudo);
        console.log(socket.rooms);
    });

    // Dès qu'on reçoit un message, on récupère le pseudo de son auteur et on le transmet aux autres personnes
    socket.on('message', function (message, room) {
        var firstChar = message.charAt(0);

        if (firstChar !== '/')
            socket.to(current_room).emit('message', {pseudo: socket.pseudo, message: message});
        else {
            var splitMessage = message.split(" ");
            var command = splitMessage[0].substr(1);
            if (splitMessage.length > 3 && command !== 'msg') {
                console.log('too many parameters');
            } else {
                if (command === 'msg') {
                    var pseudo_sender = splitMessage[1];
                    splitMessage.splice(0,2)
                    var msg_priv = splitMessage.join(" ");
                }
                switch(command) {
                    case "nick":
                            if (commands[0]) {
                                socket.pseudo = splitMessage[1];
                            }
                        break;
                    case "list":
                            if (commands[1]) {
                                socket.emit('list_room', channel);
                            }
                        break;
                    case "join":
                            if (commands[2]) {
                                socket.join(splitMessage[1]);
                                socket.emit('joined_room', socket.pseudo, splitMessage[1]);
                            }
                        break;
                    case "part":
                            if (commands[3]) {
                                socket.leave(splitMessage[1]);
                                socket.emit('leave_room', socket.pseudo, splitMessage[1]);
                            }
                        break;
                    case "users":
                            if (commands[4]) {
                                var users = [];
                                io.sockets.sockets.map(function(user) {
                                    users.push({room: user.rooms, pseudo: user.pseudo});
                                });
                                socket.emit('list_user', users);
                            }
                        break;
                    case "msg":
                            if (commands[5]) {
                                console.log(splitMessage);
                                var private_msg = {
                                    pseudo: socket.pseudo,
                                    message: msg_priv
                                };
                                users_connected.forEach(function(user) {
                                    console.log('user_pseudo foreach : ',user.pseudo);
                                    console.log('user_pseudo sender : ', pseudo_sender);
                                    if (user.pseudo === pseudo_sender)
                                        socket.broadcast.to(user.id).emit('private_msg', private_msg);
                                });
                            }
                        break;
                    case "leave":
                            if (commands[6]) {
                                socket.disconnect();
                            }
                    default:

                }
            }

        }
    });
});

server.listen(3000);