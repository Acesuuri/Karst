// chargement des librairies
import loading from "./js/loading.js";

// configuration générale du jeu
var config = {
  type: Phaser.AUTO,
  width: 1280, // largeur en pixels
  height: 720, // hauteur en pixels
   scale: {
        // Or set parent divId here
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
   },
  physics: {
    // définition des parametres physiques
    default: "arcade", // mode arcade : le plus simple : des rectangles pour gérer les collisions. Pas de pentes
    arcade: {
      // parametres du mode arcade
      gravity: {
        y: 350 // gravité verticale : acceleration ddes corps en pixels par seconde
      },
      debug: false // permet de voir les hitbox et les vecteurs d'acceleration quand mis à true
    }
  },
  scene: [loading],
  baseURL: window.location.pathname.replace(/\/[^/]*$/, '')
};

// création et lancement du jeu
var game = new Phaser.Game(config);

