export default class DialogBox extends Phaser.Scene {
    constructor() {
        super({ key: 'dialogBox' });
        this.sceneToResume = null;
        this.confirmKey = null;
    }

    create(data) {
        this.sceneToResume = data.sceneToResume;
        this.confirmKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

        const dialogBackground = this.add.graphics();
        dialogBackground.fillStyle(0x000000, 0.7);
        dialogBackground.fillRect(300, 200, 600, 300);

        const titleText = this.add.text(350, 240, "Vous avez trouvé " + data.proprietes.item_name, { fontSize: '24px', fill: '#fff' });
        const messageText = this.add.text(350, 280, data.proprietes.item_description, { fontSize: '24px', fill: '#fff' });
        const okHint = this.add.text(590, 400, 'Appuyez sur K', { fontSize: '24px', fill: '#fff' });

        titleText.setDepth(1);
        messageText.setDepth(1);
        okHint.setDepth(1);
    }

    closeDialog() {
        this.scene.stop('dialogBox');
        this.scene.resume(this.sceneToResume);
        this.scene.resume('interfaceJeu');

        // Annule l'effet fadeIn si en cours
        if (this.scene.get(this.sceneToResume).cameras.main._fadeAlpha > 0) {
            this.scene.get(this.sceneToResume).cameras.main.resetFX();
        }
    }

    update() {
        if (this.confirmKey && Phaser.Input.Keyboard.JustDown(this.confirmKey)) {
            this.closeDialog();
        }
    }
}
