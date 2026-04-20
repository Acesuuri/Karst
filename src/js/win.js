
export default class win extends Phaser.Scene {
    // constructeur de la classe
    constructor() {
        super({
            key: "win" //  ici on précise le nom de la classe en tant qu'identifiant
        });

    }

    preload() {

    }

    create(){

    const screen_win = this.add.image(this.game.config.width/2, this.game.config.height/2, "screen_win");

    const button_back = this.add.image(this.game.config.width/2, 630, "button_back");

    this.buttons = [button_back];
    this.selectedIndex = 0;

    // Configuration des touches
    this.upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.confirmKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

    // Initialiser le focus sur le bouton
    this.updateButtonSelection();

    // Stop the sound from the previous scene
    this.sound.stopByKey('son_game');

    if (!this.sound.get('son_win')) {
      console.warn('Sound "son_win" not found in the sound manager.');
    }
    else {
    this.sound.play('son_win', {
        loop: false
    });
    }
    }

    updateButtonSelection() {
        this.buttons.forEach((button, index) => {
            if (index === this.selectedIndex) {
                button.setScale(1.1);
                button.setTint(0xFF0000);
            } else {
                button.setScale(1.0);
                button.clearTint();
            }
        });
    }

    activateButton() {
        this.scene.start("accueil");
    }

    activateFocusAnimation() {
        const button = this.buttons[this.selectedIndex];
        button.clearTint();
        this.time.delayedCall(150, () => {
            this.updateButtonSelection();
        });
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.upKey) || Phaser.Input.Keyboard.JustDown(this.downKey)) {
            this.activateFocusAnimation();
        }
        if (Phaser.Input.Keyboard.JustDown(this.confirmKey)) {
            this.activateButton();
        }
    }

}