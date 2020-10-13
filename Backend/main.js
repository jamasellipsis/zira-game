const express = require("express")();
const cors = require("cors");
const { response } = require("express");
const http = require("http").createServer(express);
const io = require("socket.io")(http);
// const { MongoClient } = require("mongodb");

// const pass = process.env.MongoDB_password;

// const client = new MongoClient("mongodb+srv://MiguelCF06:" + pass + "@ziragame.qfibu.mongodb.net/gamedev?retryWrites=true&w=majority");

express.use(cors());

var collection;

io.on("connection", (socket) => {
    socket.on("join", async (gameId) => {
        try {
            // let result = await collection.findOne({ "_id": gameId });
            // if (!result) {
            //     await collection.insertOne({ "_id": gameId, messages: [] });
            // }
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
        // collection.updateOne({ "_id": socket.activeRoom }, {
        //     "$push": {
        //         "messages": message
        //     }
        // });
        io.to(socket.activeRoom).emit("message", message);
    });
});

// // Endpoint
// express.get("/chats", async (request, response) => {
//     // try {
//     //     let result = await collection.findOne({ "_id": request.query.room });
//     //     response.send(result);
//     // } catch (err) {
//     //     response.status(500).send({ message: err.message });
//     // }
// });

http.listen(3000, async () => {
    try {
        // await client.connect();
        // collection = client.db("gamedev").collection("chats");
        console.log("Listening on port :%s", http.address().port);
    } catch (err) {
        console.error(err);
    }
})