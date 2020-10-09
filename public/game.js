var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 500,
    autoResize: true,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
        }
    },
    scene: [{
        preload: preload,
        create: create,
        update: update,
    }]
};

let game = new Phaser.Game(config);

game.init = function () {
    game.stage.disableVisibilityChange = true;
};

function preload () {
    this.load.spritesheet('player', 'assets/spritexb-3320.png', { frameWidth: 32, frameHeight: 48 });
    this.load.image('bg', 'assets/background.jpeg');
}

function create () {
    let self = this;
    this.socket = io();
    this.otherPlayers = this.physics.add.group();
    this.cursors = this.input.keyboard.createCursorKeys();
    addBackground(self);
    this.socket.on('currentPlayers', function (players) {
        Object.keys(players).forEach(function (id) {
            if (players[id].playerRoom.playerId === self.socket.id) {
                addPlayer(self, players[id]);
            } else {
                addOtherPlayers(self, players[id]);
            }
        });
    });
    this.socket.on('newPlayer', function (playerInfo) {
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
            }
        });
    });

    this.anims.create({
        key: "left",
        frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7}),
        frameRate: 10,
        repeat: 0,
    });
    
    this.anims.create({
        key: "right",
        frames: this.anims.generateFrameNumbers('player', { start: 8, end: 11}),
        frameRate: 10,
        repeat: 0,
    });

    this.anims.create({
        key: "up",
        frames: this.anims.generateFrameNumbers('player', { start: 12, end: 15}),
        frameRate: 10,
        repeat: 0,
    });

    this.anims.create({
        key: "down",
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3}),
        frameRate: 10,
        repeat: 0,
    });

    this.anims.create({
        key: "turn",
        frames: [ { key: 'player', frame: 0}],
        frameRate: 20,
    })
}

function update () {
    if (this.player) {
        if (this.cursors.left.isDown) {
            this.player.anims.play('left', true);
            this.player.x -= 2;
        } else if (this.cursors.right.isDown) {
            this.player.anims.play('right', true);
            this.player.x += 2;
        } else if (this.cursors.up.isDown) {
            this.player.anims.play('up', true);
            this.player.y -= 2;
        } else if (this.cursors.down.isDown) {
            this.player.anims.play('down', true);
            this.player.y += 2;
        } else {
            this.player.setVelocity(0, 0);
        }

        let x = this.player.x;
        let y = this.player.y;
        if (this.player.oldPosition && (x !== this.player.oldPosition.x || y !== this.player.oldPosition.y)) {
            this.socket.emit('playerMovement', { x: this.player.x, y: this.player.y});
        }

        this.player.oldPosition = {
            x: this.player.x,
            y: this.player.y,
        };
    }
}


function addPlayer (self, playerInfo) {
    self.player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'player').setOrigin(0, 0).setDisplaySize(38, 42);
};

function addOtherPlayers (self, playerInfo) {
    const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'player').setOrigin(0, 0).setDisplaySize(38, 42);
    otherPlayer.playerId = playerInfo.playerId;
    self.otherPlayers.add(otherPlayer);
}

function addBackground (self) {
    self.background = self.add.image(0, 0, 'bg').setOrigin(0, 0).setDisplaySize(800, 500);
}