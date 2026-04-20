
export default class accueil extends Phaser.Scene {
    // constructeur de la classe
    constructor() {
        super({
            key: "accueil" //  ici on précise le nom de la classe en tant qu'identifiant
        });
    }

    preload() {

    }

    create(){
        const screen_welcome = this.add.image(this.game.config.width/2, this.game.config.height/2, "screen_welcome");

        const bouton_play     = this.add.image(300, 350, "button_play");
        const bouton_controls = this.add.image(300, 450, "button_controls");
        const bouton_credits  = this.add.image(300, 550, "button_credits");
        
        this.buttons = [bouton_play, bouton_controls, bouton_credits];
        this.selectedIndex = 0;
        
        // Configuration des touches
        this.upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
        this.downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
        this.confirmKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
        
        // Initialiser le focus sur le premier bouton
        this.updateButtonSelection();

        // Handle AudioContext autoplay restrictions
        this.audioInitialized = false;
        
        // Add click/touch event to resume audio context
        this.input.on('pointerdown', () => {
            if (!this.audioInitialized) {
                this.sound.context.resume().then(() => {
                    this.audioInitialized = true;
                    this.playIntroMusic();
                });
            }
        });
        
        // Add keyboard event to resume audio context
        this.input.keyboard.on('keydown', () => {
            if (!this.audioInitialized) {
                this.sound.context.resume().then(() => {
                    this.audioInitialized = true;
                    this.playIntroMusic();
                });
            }
        });

        if (this.sound.get("son_win")) {
            this.sound.stopByKey("son_win");
        }
        if (this.sound.get("son_game_over")) {
            this.sound.stopByKey("son_game_over");
        }
    }

    playIntroMusic() {
        if (this.sound.get("son_intro")) {
            this.sound.play("son_intro", { loop: true });
        }
    }

    updateButtonSelection() {
        this.buttons.forEach((button, index) => {
            if (index === this.selectedIndex) {
                button.setScale(1.2);
                button.setTint(0xFF0000);
            } else {
                button.setScale(1.0);
                button.clearTint();
            }
        });
    }

    activateButton() {
        switch (this.selectedIndex) {
            case 0: // Play
                this.scene.stop("pagedelancement");
                this.scene.start("story");
                break;
            case 1: // Controls
                this.scene.switch("controls");
                break;
            case 2: // Credits
                this.scene.switch("credits");
                break;
        }
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.upKey)) {
            this.selectedIndex = (this.selectedIndex - 1 + this.buttons.length) % this.buttons.length;
            this.updateButtonSelection();
        }
        if (Phaser.Input.Keyboard.JustDown(this.downKey)) {
            this.selectedIndex = (this.selectedIndex + 1) % this.buttons.length;
            this.updateButtonSelection();
        }
        if (Phaser.Input.Keyboard.JustDown(this.confirmKey)) {
            this.activateButton();
        }
    }

}