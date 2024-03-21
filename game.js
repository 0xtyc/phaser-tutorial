var config = {
  type: Phaser.AUTO, // try Phaser.WEBGL, and fallback to Phaser.CANVAS
  width: 800, // desplay resolution
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

var player;
var stars;
var bombs;
var platforms;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;

var game = new Phaser.Game(config);

function preload() {
  this.load.image("sky", "assets/sky.png"); // asset key, path to asset
  this.load.image("ground", "assets/platform.png");
  this.load.image("star", "assets/star.png");
  this.load.image("bomb", "assets/bomb.png");
  this.load.image("watermark", "assets/watermark.png");
  // this png contains 9 frames, 32 x 48 pixels each
  this.load.spritesheet("dude", "assets/dude.png", {
    frameWidth: 32,
    frameHeight: 48,
  });
}

function create() {
  //  A simple background for our game
  // game objects are positioned based on their center by default
  // (400, 300) will center this image in our 800 x 600 canvas
  this.add.image(400, 300, "sky"); // x, y, asset key

  // the display order is the order in which you add them
  this.add.image(400, 300, "watermark").setScale(0.2).setAlpha(0.5);

  //  The platforms group contains the ground and the 2 ledges we can jump on
  platforms = this.physics.add.staticGroup();

  //  Here we create the ground.
  //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
  platforms.create(400, 568, "ground").setScale(2).refreshBody(); // refreshBody() is required because we have scaled a static physics body

  //  Now let's create some ledges
  platforms.create(600, 400, "ground");
  platforms.create(50, 250, "ground");
  platforms.create(750, 220, "ground");

  // The player and its settings
  player = this.physics.add.sprite(100, 450, "dude"); // x, y, asset key

  //  Player physics properties. Give the little guy a slight bounce.
  player.setBounce(0.2);
  player.setCollideWorldBounds(true); //stop the player from going off the screen

  //  Our player animations, turning, walking left and walking right.
  // define the animations here for use in the update function (reference with key)
  this.anims.create({
    key: "left",
    // use the frame [0, 1, 2, 3] from the spritesheet "dude"
    frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
    frameRate: 10, // 10 frames per second
    repeat: -1, // loop the animation
  });

  // this is defined when the player is not moving
  this.anims.create({
    key: "turn",
    frames: [{ key: "dude", frame: 4 }],
    frameRate: 200,
  });

  this.anims.create({
    key: "right",
    frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1,
  });

  //  Input Events
  cursors = this.input.keyboard.createCursorKeys();

  // //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
  stars = this.physics.add.group({
    key: "star", // asset key
    repeat: 11, // repeat 11 times, we have 12 stars
    setXY: { x: 12, y: 0, stepX: 70 },
  });

  stars.children.iterate(function (child) {
    //  Give each star a slightly different bounce
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
  });

  bombs = this.physics.add.group();

  //  The score
  scoreText = this.add.text(16, 16, "score: 0", {
    fontSize: "32px",
    fill: "#000",
  });

  //  Collide the player and the stars with the platforms
  this.physics.add.collider(player, platforms);
  this.physics.add.collider(stars, platforms);
  this.physics.add.collider(bombs, platforms);

  //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
  // first two parameters are the objects to check for overlap
  // third parameter is the callback function to call when the overlap occurs
  // fourth parameter is the callback to determine if the overlap should occur (if return false, the overlap is ignored)
  this.physics.add.overlap(player, stars, collectStar, null, this);

  this.physics.add.collider(player, bombs, hitBomb, null, this);
}

function update() {
  if (gameOver) {
    return;
  }

  if (cursors.left.isDown) {
    player.setVelocityX(-160);

    player.anims.play("left", true);
  } else if (cursors.right.isDown) {
    player.setVelocityX(160);

    player.anims.play("right", true);
  } else {
    player.setVelocityX(0);

    player.anims.play("turn");
  }

  if (cursors.up.isDown && player.body.touching.down) {
    player.setVelocityY(-330); // negative velocity moves up
  }
}

function collectStar(player, star) {
  // first parameter is to disable the game object (not updated and rerendered)
  // second is to hide the object from the screen
  star.disableBody(true, true);

  //  Add and update the score
  score += 10;
  scoreText.setText("Score: " + score);

  if (stars.countActive(true) === 0) {
    //  A new batch of stars to collect
    stars.children.iterate(function (child) {
      // first three parameters to reset the position of the object (ifreset, x, y)
      // last two parameters to enable and make the object visible
      child.enableBody(true, child.x, 0, true, true); // reset the y coordinate to 0
    });

    var x =
      player.x < 400
        ? Phaser.Math.Between(400, 800)
        : Phaser.Math.Between(0, 400);

    var bomb = bombs.create(x, 16, "bomb");
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    bomb.allowGravity = false; // not affected by gravity
  }
}

function hitBomb(player, bomb) {
  this.physics.pause();

  player.setTint(0xff0000);

  player.anims.play("turn");

  gameOver = true;
}
