const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const players = {};

app.set('views', './views')
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

const rooms = { }

app.get('/', (req, res) => {
  res.render('index', { rooms: rooms })
})

app.post('/room', (req, res) => {
  if (rooms[req.body.room] != null) {
    return res.redirect('/')
  }
  rooms[req.body.room] = { users: {} }
  res.redirect(req.body.room)
  // Send message that new room was created
  io.emit('room-created', req.body.room)
})

app.get('/:room', (req, res) => {
  if (rooms[req.params.room] == null) {
    return res.redirect('/')
  }
  res.render('room', { roomName: req.params.room })
})

server.listen(3000)

io.on('connection', socket => {
  socket.on('new-user', (room, name) => {
    console.log('User joined a room ' + room);
    socket.join(room, () => {
      let rooms = Object.keys(socket.rooms);
    });
    rooms[room].users[socket.id] = name
    // socket.to(room).broadcast.emit('user-connected', name)

    players[socket.id] = {
      x: Math.floor(Math.random() * 700) + 50,
      y: Math.floor(Math.random() * 500) + 50,
      playerRoom: {
        roomName: room,
        playerId: socket.id,
      },
    };
    
    console.log("My player id is " + players[socket.id].playerRoom.playerId + " and my room is " + players[socket.id].playerRoom.roomName);
    socket.to(players[socket.id].playerRoom.roomName).emit('currentPlayers', players);
    socket.to(players[socket.id].playerRoom.roomName).broadcast.emit('newPlayer', players[socket.id]);
    socket.on('disconnect', function () {
      console.log('user disconnected');
      delete players[socket.id];
      io.emit('disconnect', socket.id);
    });
    socket.on('playerMovement', function (movementData) {
      players[socket.id].x = movementData.x;
      players[socket.id].y = movementData.y;
      // emit a message to all players about the player that moved
      socket.to(players[socket.id].playerRoom.roomName).broadcast.emit('playerMoved', players[socket.id]);
    })
  })
  
  

  socket.on('send-chat-message', (room, message) => {
    socket.to(room).emit('chat-message', { message: message, name: rooms[room].users[socket.id] })
  })
  socket.on('disconnect', () => {
    getUserRooms(socket).forEach(room => {
      socket.to(room).broadcast.emit('user-disconnected', rooms[room].users[socket.id])
      delete rooms[room].users[socket.id]
    })
  })
})

function getUserRooms(socket) {
  return Object.entries(rooms).reduce((names, [name, room]) => {
    if (room.users[socket.id] != null) names.push(name)
    return names
  }, [])
}
