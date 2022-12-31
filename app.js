const express = require('express');
const app = express();
let randomColor = require('randomcolor');
const uuid = require('uuid');

app.use(express.static('client'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/client/index.html');
});

// let ipAddress = '10.3.32.29';

var server = app.listen(3000);

const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "OPTIONS"],
    },
    allowEIO3: true
});

let users = [];
let connections = [];

io.on('connection', (socket) => {
    console.log('new user connected');
    connections.push(socket);
    let color = randomColor();

    socket.username = 'Anonymous';
    socket.color = color;

    socket.on('change_username', (data) => {
        let id = uuid.v4();
        socket.id = id;
        socket.username = data.nickName;
        users.push({id, username: socket.username, color: socket.color});
        updateUsernames();
    });

    const updateUsernames = () => {
        io.sockets.emit('get users', users);
    }

    socket.on('new_message', (data) => {
        io.sockets.emit(
            'new_message',
            {message: data.message, username: socket.username, color: socket.color});
    });

    socket.on('disconnect', data => {
        if (!socket.username) return;
        let user = undefined;

        for (let i = 0; i < users.length; i++) {
            if (users[i].id === socket.id) {
                user = users[i];
                break;
            }
        }

        users = users.filter(x => x !== user);
        updateUsernames();
        connections.splice(connections.indexOf(socket), 1);
    });

    socket.on('typing', data => {
        socket.broadcast.emit('typing', {username: socket.username});
    })
});