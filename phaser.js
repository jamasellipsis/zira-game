const url = window.location.href.split('_')

localStorage.setItem("username", url[1])
localStorage.setItem("room", url[2])

    const phaserConfig = {
        type: Phaser.AUTO,
        parent: "game",
        width: 1300,
        height: 600,
        backgroundColor: "#E7F6EF",
        physics: {
            default: 'arcade',
            arcade: {
                debug: false,
            }
        },
        dom: {
            createContainer: true
        },
        scene: {
            init: initScene,
            preload: preloadScene,
            create: createScene,
            update: updateScene
        }
    }

    const socket = io("https://zira-games.herokuapp.com:"+process.env.PORT, { autoConnect: false });
    const game = new Phaser.Game(phaserConfig);
    let idGame;
    const videoGrid = document.getElementById('video-grid')
    const myVideo = document.createElement('video');
    myVideo.muted = true;
    const myPeer = new Peer(undefined, {
            host: '/',
            port: process.env.PORTs,
            path: '/peerjs'
    });
    const peers = {};

    // ========== WebCam ==========
    navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        }).then(stream => {
            addVideoStream(myVideo, stream)
            myPeer.on('call', call => {
                call.answer(stream)
                const video = document.createElement('video')
                call.on('stream', userVideoStream => {
                    addVideoStream(video, userVideoStream)
                })
            }, function(err) {
                console.log("Failed to get stream ", err)
            })

            socket.on('userCam-connected', userId => {
                connectToNewUser(userId, stream)
            })
        })
        // ========== WebCam ==========

        socket.on('user-disconnected', userId => {
            if (peers[userId]) peers[userId].close()
        })

        myPeer.on('open', id => {
            let room = localStorage.getItem("room");
            socket.emit('joinCam', room, id)
            console.log("Este es mi id " + id + " y room " + room)
        })


    function initScene() {
        this.socket = socket
        this.chatMessages = [];
        this.otherPlayers = this.physics.add.group();
    }
    

    function preloadScene() {
        this.load.html("form", "form.html");
        this.load.image('bg', 'assets/background.jpeg');
        this.load.spritesheet('player', 'assets/spritexb-3320.png', { frameWidth: 32, frameHeight: 48 });
    }

    function createScene() {
        this.textInput = this.add.dom(1200, 560).createFromCache("form").setOrigin(0.5);
        this.chat = this.add.text(1065, 1, "", {
            lineSpacing: 15,
            backgroundColor: "#21313CDD",
            color: "#40b9c1",
            padding: 10,
            fontStyle: "bold"
        });
        this.chat.setFixedSize(270, 535);
        this.chat.setDepth(1);

        // Player
        this.bg = this.add.image(0, 0, 'bg').setOrigin(0, 0).setDisplaySize(1300, 600);
        let inputUsername = localStorage.getItem("username");
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.enterKey.on("down", event => {
            let chatBox = this.textInput.getChildByName("chat");
            if (chatBox.value != "") {
                this.socket.emit("message", inputUsername + ": " + chatBox.value);
                chatBox.value = "";
            }
        });
        
        let self = this;

        this.socket.connect();
        this.socket.on("connect", async () => {
            let room = localStorage.getItem("room");
            this.socket.emit('join', room);
        });
        
        this.socket.on("joined", (players, gameId) => {
            this.chatMessages.push("Welcome to your class!");
            if (this.chatMessages.length > 20) {
                this.chatMessages.shift();
            }
            this.chat.setText(this.chatMessages);
            idGame = gameId;
            Object.keys(players).forEach(function (id) {
                if (players[id].playerId === self.socket.id) {
                    addPlayer(self, players[id]);
                } else if (players[id].gameId === gameId) {
                    addOtherPlayers(self, players[id])
                }
            });

            console.log(gameId, '------> gameId');
            console.log(inputUsername, '------> inputusername');
            console.log(this.otherPlayers, '------> otherPlayer');
            console.log(this.player, '------> player');
        });

        this.socket.on("message", (message) => {
            this.chatMessages.push(message);
            if (this.chatMessages.length > 20) {
                this.chatMessages.shift();
            }
            this.chat.setText(this.chatMessages);
        });

        this.socket.on('newPlayer', function (playerInfo) {
            console.log(playerInfo, '------> New Playerinfo')
            addOtherPlayers(self, playerInfo);
        });

        this.socket.on('disconnect', function (playerId) {
            self.otherPlayers.getChildren().forEach(function (otherPlayer) {
                if (playerId === otherPlayer.playerId) {
                    otherPlayer.destroy();
                }
            });
        });

        

        this.socket.on('playerMoved', function (playerInfo) {
            self.otherPlayers.getChildren().forEach(function (otherPlayer) {
                if (playerInfo.playerId === otherPlayer.playerId) {
                    otherPlayer.setPosition(playerInfo.x, playerInfo.y);
                    otherPlayer.anims.play(playerInfo.playerAnim.key, true)
                }
            });
        });


        // =========== ANIMATIONS START=============
        this.anims.create({
            key: "left",
            frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
            frameRate: 100,
            repeat: 0,
        });

        this.anims.create({
            key: "right",
            frames: this.anims.generateFrameNumbers('player', { start: 8, end: 11 }),
            frameRate: 100,
            repeat: 0,
        });

        this.anims.create({
            key: "up",
            frames: this.anims.generateFrameNumbers('player', { start: 12, end: 15 }),
            frameRate: 100,
            repeat: 0,
        });

        this.anims.create({
            key: "down",
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 100,
            repeat: 0,
        });
        // =========== ANIMATIONS END =============
    }

    function updateScene() {
        this.keyLeft = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.keyRight = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        this.keyUp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
        this.keyDown = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
        
        if (this.player) {
            if (this.keyLeft.isDown) {
                this.player.anims.play('left', true);
                this.player.x -= 10;
            } else if (this.keyRight.isDown) {
                this.player.anims.play('right', true);
                this.player.x += 10;
            } else if (this.keyUp.isDown) {
                this.player.anims.play('up', true);
                this.player.y -= 10;
            } else if (this.keyDown.isDown) {
                this.player.anims.play('down', true);
                this.player.y += 10;
            } else {
                this.player.setVelocity(0, 0);
            }

            let x = this.player.x;
            let y = this.player.y;
            let playerAnim = this.player.anims.currentAnim;
            if (this.player.oldPosition && (x !== this.player.oldPosition.x || y !== this.player.oldPosition.y)) {
                this.socket.emit('playerMovement', { x: this.player.x, y: this.player.y, playerAnim: this.player.anims.currentAnim });
            }

            this.player.oldPosition = {
                x: this.player.x,
                y: this.player.y,
                playerAnim: this.player.anims.currentAnim,
            };
        }
    }

    function addPlayer(self, playerInfo) {
        self.player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'player').setOrigin(0, 0)
            .setDisplaySize(38, 42)
            .setCollideWorldBounds(true);
    }

    function addOtherPlayers(self, playerInfo) {
        const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'player').setOrigin(0, 0)
            .setDisplaySize(38, 42);
        otherPlayer.playerId = playerInfo.playerId;
        self.otherPlayers.add(otherPlayer);
    }

    // Show and hide Game, Whiteboard, Camera
    function showGame() {
        document.getElementById('game').style.display = "block";
        document.getElementById('whiteboard').style.display = "none";
        document.getElementById('video-grid').style.display = "none";
    }

    function showWhiteboard() {
        document.getElementById('game').style.display = "none";
        document.getElementById('whiteboard').style.display = "block";
        document.getElementById('video-grid').style.display = "none";
    }

    function showVideo() {
        document.getElementById('game').style.display = "none";
        document.getElementById('whiteboard').style.display = "none";
        document.getElementById('video-grid').style.display = "block";
    }

    function connectToNewUser(userId, stream) {
        const call = myPeer.call(userId, stream)
        const video = document.createElement('video')
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream)
        })
        call.on('close', () => {
            video.remove()
        })
        peers[userId] = call
    }

    function addVideoStream(video, stream) {
        video.srcObject = stream
        video.addEventListener('loadedmetadata', () => {
            video.play()
        })
        videoGrid.append(video)
    }