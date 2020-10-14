const express = require("express")();
const cors = require("cors");
const { response } = require("express");
const http = require("http").createServer(express);
const io = require("socket.io")(http);

express.use(cors());

io.on("connection", (socket) => {
    socket.on("join", async (gameId) => {
        try {
            socket.join(gameId);
            socket.emit("joined", gameId);
            socket.activeRoom = gameId;
        } catch (err) {
            console.error(err);
        }
    });
    // // When a user connects
    // socket.to(socket.activeRoom).broadcast.emit("message", 'A user has joined the chat');

    // // Runs when client disconnects
    // socket.on("disconnect", () => {
    //     io.to(socket.activeRoom).emit('message', 'A user has left the chat');
    // });

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