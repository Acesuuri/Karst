export default class story extends Phaser.Scene {
  // constructeur de la classe
  constructor() {
    super({
      key: "story" //  ici on précise le nom de la classe en tant qu'identifiant
    });
  }

  preload() {

  }

  create() {
    const screen_welcome = this.add.image(this.game.config.width/2, this.game.config.height/2, "screen_story");

    const button_play = this.add.image(this.game.config.width/2, 630, "button_play");
    
    this.buttons = [button_play];
    this.selectedIndex = 0;
    
    // Configuration des touches
    this.upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.confirmKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    
    // Initialiser le focus sur le bouton
    this.updateButtonSelection();
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

  activateFocusAnimation() {
    // Effet feedback quand on appuie sur haut/bas avec un seul bouton
    const button = this.buttons[this.selectedIndex];
    button.clearTint();
    
    this.time.delayedCall(150, () => {
      this.updateButtonSelection();
    });
  }

  activateButton() {
    this.scene.launch('interfaceJeu');
    this.scene.bringToTop('interfaceJeu');
    this.scene.switch("map_recto");
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.upKey) || Phaser.Input.Keyboard.JustDown(this.downKey)) {
      // Si un seul bouton, faire un effet de feedback
      if (this.buttons.length === 1) {
        this.activateFocusAnimation();
      } else {
        // Sinon, naviguer normalement
        if (Phaser.Input.Keyboard.JustDown(this.upKey)) {
          this.selectedIndex = (this.selectedIndex - 1 + this.buttons.length) % this.buttons.length;
        } else {
          this.selectedIndex = (this.selectedIndex + 1) % this.buttons.length;
        }
        this.updateButtonSelection();
      }
    }
    
    if (Phaser.Input.Keyboard.JustDown(this.confirmKey)) {
      this.activateButton();
    }
  }

}
