const express = require("express")();
const cors = require("cors");
const { response } = require("express");
const http = require("http").createServer(express);
const io = require("socket.io")(http);
let players = {};

express.use(cors());

io.on("connection", (socket) => {
    players[socket.id] = {
        x: 20,
        y: 20,
        playerId: socket.id,
        playerAnim: {},
        gameId: ''
    };
    socket.on("join", async (gameId, camId) => {
        try {
            console.log("user joined");
            socket.join(gameId);
            socket.activeRoom = gameId;

            socket.emit("joined", players, gameId);
            players[socket.id].gameId = gameId;
            socket.to(socket.activeRoom).broadcast.emit('userCam-connected', camId)
            socket.to(socket.activeRoom).broadcast.emit('newPlayer', players[socket.id]);
        } catch (err) {
            console.error(err);
        }
        socket.on('camDisconnect', () => {
            socket.to(socket.activeRoom).broadcast.emit('user-disconnected', camId)
        })
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
        players[socket.id].playerAnim = movementData.playerAnim;
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