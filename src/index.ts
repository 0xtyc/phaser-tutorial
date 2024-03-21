import * as Phaser from "phaser";

class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private stars!: Phaser.Physics.Arcade.Group;
  private bombs!: Phaser.Physics.Arcade.Group;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  private score: number = 0;
  private gameOver: boolean = false;
  private scoreText!: Phaser.GameObjects.Text;

  constructor() {
    super("MainScene");
  }

  preload() {
    // preload assets
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

  create() {
    // create game objects
    //  A simple background for our game
    // game objects are positioned based on their center by default
    // (400, 300) will center this image in our 800 x 600 canvas
    this.add.image(400, 300, "sky"); // x, y, asset key

    // the display order is the order in which you add them
    this.add.image(400, 300, "watermark").setScale(0.2).setAlpha(0.5);

    //  The platforms group contains the ground and the 2 ledges we can jump on
    this.platforms = this.physics.add.staticGroup();

    //  Here we create the ground.
    //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
    this.platforms.create(400, 568, "ground").setScale(2).refreshBody(); // refreshBody() is required because we have scaled a static physics body

    //  Now let's create some ledges
    this.platforms.create(600, 400, "ground");
    this.platforms.create(50, 250, "ground");
    this.platforms.create(750, 220, "ground");

    // The player and its settings
    this.player = this.physics.add.sprite(100, 450, "dude"); // x, y, asset key

    //  Player physics properties. Give the little guy a slight bounce.
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true); //stop the player from going off the screen

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
    this.cursors = this.input?.keyboard?.createCursorKeys();

    //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
    this.stars = this.physics.add.group({
      key: "star", // asset key
      repeat: 11, // repeat 11 times, we have 12 stars
      setXY: { x: 12, y: 0, stepX: 70 },
    });

    this.stars.children.iterate((child) => {
      //  Give each star a slightly different bounce
      // cast the child to access the setBounceY method
      (child as Phaser.Physics.Arcade.Image).setBounceY(
        Phaser.Math.FloatBetween(0.4, 0.8)
      );
      return true;
    });

    this.bombs = this.physics.add.group();

    //  The score
    this.scoreText = this.add.text(16, 16, "score: 0", {
      fontSize: "32px",
      color: "#000",
    });

    //  Collide the player and the stars with the platforms
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.stars, this.platforms);
    this.physics.add.collider(this.bombs, this.platforms);

    //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
    // first two parameters are the objects to check for overlap
    // third parameter is the callback function to call when the overlap occurs
    // fourth parameter is the callback to determine if the overlap should occur (if return false, the overlap is ignored)
    this.physics.add.overlap(
      this.player,
      this.stars,
      this.collectStar,
      undefined,
      this
    );

    this.physics.add.collider(
      this.player,
      this.bombs,
      this.hitBomb,
      undefined,
      this
    );
  }

  update() {
    // update game state
    if (this.gameOver) {
      return;
    }

    if (this.cursors?.left.isDown) {
      this.player.setVelocityX(-160);

      this.player.anims.play("left", true);
    } else if (this.cursors?.right.isDown) {
      this.player.setVelocityX(160);

      this.player.anims.play("right", true);
    } else {
      this.player.setVelocityX(0);

      this.player.anims.play("turn");
    }

    if (this.cursors?.up.isDown && this.player.body?.touching.down) {
      this.player.setVelocityY(-330); // negative velocity moves up
    }
  }

  private hitBomb(player: any, _bomb: any) {
    this.physics.pause();

    (player as Phaser.Physics.Arcade.Sprite).setTint(0xff0000);

    (player as Phaser.Physics.Arcade.Sprite).anims.play("turn");

    this.gameOver = true;
  }

  private collectStar(player: any, star: any) {
    // first parameter is to disable the game object (not updated and rerendered)
    // second is to hide the object from the screen
    (star as Phaser.Physics.Arcade.Image).disableBody(true, true);

    //  Add and update the score
    this.score += 10;
    this.scoreText.setText("Score: " + this.score);

    if (this.stars.countActive(true) === 0) {
      //  A new batch of stars to collect
      this.stars.children.iterate((child) => {
        // first three parameters to reset the position of the object (ifreset, x, y)
        // last two parameters to enable and make the object visible
        (child as Phaser.Physics.Arcade.Image).enableBody(
          true,
          (child as Phaser.Physics.Arcade.Image).x,
          0,
          true,
          true
        );
        // reset the y coordinate to 0
        return true;
      });

      const x =
        (this.player as Phaser.Physics.Arcade.Sprite).x < 400
          ? Phaser.Math.Between(400, 800)
          : Phaser.Math.Between(0, 400);

      const bomb = this.bombs.create(x, 16, "bomb");
      bomb.setBounce(1);
      bomb.setCollideWorldBounds(true);
      bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
      bomb.allowGravity = false; // not affected by gravity
    }
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 300 },
      debug: false,
    },
  },
  scene: MainScene,
};

new Phaser.Game(config);
