import PlayerConfig from "./PlayerConfig.js";
import * as fct from "./fonctions.js";

// Scène Interface de jeu : contient les points de vie, le nombre de vie, les objectifs
// éléments raffraichis à chaque chargement 
export default class interfaceJeu extends Phaser.Scene {

    // constructeur de la classe
    constructor() {
        super({
            key: "interfaceJeu" //  ici on précise le nom de la classe en tant qu'identifiant
        });
    }

    create() {
        this.playerProperties = new PlayerConfig(this.game.config);
        this.remainingEnemies = this.sys.settings.data.remainingMonsters;
        this.remainingItems = this.sys.settings.data.remainingItems;
        this.destinationReached = false;
        this.enemis_to_kill = this.sys.settings.data.remainingMonsters;
        this.items_to_collect = this.sys.settings.data.remainingItems;
        this.currentLevel = "recto";
        // récupération des objectifs dans l'interface
        this.objectives = {};
        this.objectives["kill_them_all"] = this.game.config.objective_kill_them_all;
        this.objectives["collect_all_items"] = this.game.config.objective_collect_all_items;
        this.objectives["reach_destination"] = this.game.config.objective_reach_destination;
        this.objectives["complete_in_time"] = this.game.config.objective_complete_in_time;

        // chronometre
        this.max_time = -1;

        if (this.objectives["complete_in_time"]) {
            this.max_time = this.game.config.objective_max_time;
        }
        this.playerProperties.remainingTime = this.max_time;
        /* Exemple de calcul des conditions de victoire (désactivé) :
            if (!objective_kill_them_all   || kills >= enemis_to_kill)      victoryConditions++;
            if (!objective_collect_all_items || itemsCollected >= items_to_collect) victoryConditions++;
            if (!objective_reach_destination || destinationReached)          victoryConditions++;
        */
        // zone des coeurs
        this.heartText = this.add.text({ fontFamily: 'Arial', fontSize: 24, color: '#ffffff' });
        this.heartText.setPosition(30, 18);
        this.heartsGroup = this.add.group();
        this.afficherCoeurs();

        // zone des vies
        // this.livesText = this.add.text(0, 0, 'Vies:          X ' + this.getPlayerLife(), { fontFamily: 'Arial', fontSize: 24, color: '#ffffff' });
        // var liveSprite = this.add.sprite(0, 0, 'player_move_right_SS').setOrigin(1, 0);
        // this.livesText.setOrigin(1, 0);
        // this.livesText.setPosition(this.sys.game.config.width - 30, 18);
        // liveSprite.setPosition(this.sys.game.config.width - 75, 0);

        // zone des enemis 
        // if (this.objectives["kill_them_all"]) {
        //     this.enemyText = this.add.text(850, 18, 'Ennemis tués : ' + this.playerProperties.kills + '/' + this.enemis_to_kill, { fontFamily: 'Arial', fontSize: 24, color: '#ffffff' });
        // }
        // zone des item 
        // if (this.objectives["collect_all_items"]) {
        //     this.itemText = this.add.text(850, 18, 'Items collectés : ' + this.playerProperties.itemsCollected + '/' + this.items_to_collect, { fontFamily: 'futura', fontSize: 32, color: '#ff0000' });
        // }
        // affichage alignés en vertical
        // if (this.objectives["kill_them_all"] && this.objectives["collect_all_items"]) {
        //     this.enemyText.setPosition(850, 4);
        //     this.itemText.setPosition(850, 30);
        // }

        // zone du temps restant : désactivé
        // if (this.objectives["complete_in_time"]) {
        //     this.timeText = this.add.text(540, 18, 'temps restant : ' + this.playerProperties.remainingTime, { fontFamily: 'Arial', fontSize: 24, color: '#ffffff' });

        //     var timerChrono = this.time.addEvent({
        //         delay: 1000, // ms
        //         callback:  this.spendOneSecond,
        //         args: [],
        //         callbackScope: this,
        //         repeat: -1
        //     });
        // }

    }

    switchLevel() {
       console.log("changement de level");

        if (this.currentLevel === "recto") {
            this.currentLevel = "verso";
        } else {
            this.currentLevel = "recto";
        }
        this.playerProperties.switchLevel(this.currentLevel);
  
        return this.currentLevel;
    }

    afficherCoeurs() {
        // Supprimer tous les anciens cœurs affichés
        this.heartsGroup.clear(true, true);

        // Position initiale pour les cœurs (en haut à gauche)
        let x = 30;
        let y = 18;

        // Boucle pour afficher les cœurs en fonction du nombre de points de vie
        for (let i = 0; i < this.getPlayerHealth(); i++) {
            let heart = this.add.image(x, y, 'coeur').setOrigin(0, 0);
            heart.setDisplaySize(24, 24); // Ajuster l'échelle si nécessaire
            x += 28; // Espacement entre les cœurs
            this.heartsGroup.add(heart);
        }
    }

    updateKills() {
        if (this.objectives["kill_them_all"])
        this.enemyText.setText('Ennemis tués : ' + this.playerProperties.kills + '/' + this.enemis_to_kill);
    }

    updateItems() {
               if (this.objectives["collect_all_items"]) {
        this.itemText.setText('Items collectés : ' + this.playerProperties.itemsCollected + '/' + this.items_to_collect);
               }
    }

    // updateTime() {
    //     this.timeText.setText('temps restant : ' + this.playerProperties.remainingTime);
    // }

    // spendOneSecond() {
    //     if (this.getRemainingTime() > 0) {
    //         this.playerProperties.remainingTime--;
    //         this.updateTime();
    //     }
    //     else if (this.getRemainingTime() == 0) {
    //         fct.gameOver.call(this);
    //     }
    // }

    // getRemainingTime() {
    //     return this.playerProperties.remainingTime;
    // }

    getPlayerLife() {
        return this.playerProperties.lifes;
    }

    getPlayerHealth() {
        return this.playerProperties.health;
    }

    setDestinationReached(reachedValue) {
        this.playerProperties.destinationReached = reachedValue;
    }

    launchWinScene() {
        this.scene.stop();
        this.game.config.sceneTarget = "recto";
        this.scene.stop("map_recto");
        this.scene.stop("map_verso");
        this.scene.stop("interface_jeu");
        this.scene.start("win");
    }

    winningConditionsOK() {
        if (this.objectives["kill_them_all"] && this.playerProperties.kills < this.enemis_to_kill ) return false;
        if (this.objectives["collect_all_items"] && this.playerProperties.itemsCollected < this.items_to_collect ) return false;
        if (this.objectives["reach_destination"] && this.playerProperties.destinationReached == false) return false;
        return true;
    }

}