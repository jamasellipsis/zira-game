const express = require("express")();
const cors = require("cors");
const { response } = require("express");
const http = require("http").createServer(express);
const io = require("socket.io")(http);
let players = {};

express.use(cors());

io.on("connection", (socket) => {
    players[socket.id] = {
        // x: Math.floor(Math.random() * 700) + 50,
        // y: Math.floor(Math.random() * 500) + 50,
        x: 20,
        y: 20,
        playerId: socket.id,
        playerAnim: {},
        
    };
    socket.on("join", async (gameId) => {
        try {
            console.log("user joined");
            socket.join(gameId);
            socket.activeRoom = gameId;

            socket.emit("joined", players, gameId);
            socket.to(socket.activeRoom).broadcast.emit('newPlayer', players[socket.id]);
        } catch (err) {
            console.error(err);
        }
    });

    socket.on('disconnect', function () {
        console.log('user disconnected');
        delete players[socket.id];
        io.to(socket.activeRoom).emit('disconnect', socket.id);
    });

    socket.on('playerMovement', function (movementData) {
        players[socket.id].x = movementData.x;
        players[socket.id].y = movementData.y;
        // emit a message to all players about the player that moved
        socket.to(socket.activeRoom).broadcast.emit('playerMoved', players[socket.id]);
    })

    socket.on("message", (message) => {
        io.to(socket.activeRoom).emit("message", message);
    });
});

http.listen(3000, async () => {
    try {
        console.log("Listening on port :%s", http.address().port);
    } catch (err) {
        console.error(err);
    }
})