import * as fct from "./fonctions.js";
import Player from "./Player.js";

export default class map_recto extends Phaser.Scene {
  spawnPoint = [];

  constructor() {
    super({ key: "map_recto" });
  }

  preload() {}

  create() {
    this.mapReversed = false;

    // Joueur et clavier
    fct.playerCreation.call(this);
    this.player = new Player(this, 0, 0, "perso");
    // application du scale initial pour la map recto
    var scaleRecto = this.game.config.initial_scale_recto || 1;
    this.player.setScale(scaleRecto);
    this.player.body.setSize(this.player.frame.width, this.player.frame.height);
    this.player.body.setOffset(0, 0);
    this.cursor   = this.input.keyboard.createCursorKeys();
    this.actionKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SEMICOLON);

    // Groupes physiques (balles, portails, ennemis, items…)
    fct.groupsCreation.call(this);

    // Carte Tiled
    this.map         = this.make.tilemap({ key: 'map_recto' });
    this.tileset      = this.map.addTilesetImage('grande_tuilev2',       'tileset_image');
    this.tileset_extra = this.map.addTilesetImage('tuile_cartev2', 'tileset_image_extra');

    // Calques de la carte
    fct.commonLayersCreation.call(this);

    // Taille du monde et caméra
    fct.worldsBoundsAndCameraConfiguration.call(this);

    // Point de départ et destinations (depuis l'object_layer)
    const tab_objects = this.map.getObjectLayer("interaction");
    this.destinations = [];
    // Rend les destinations accessibles depuis la scène pour les ennemis
    this.scene.destinations = this.destinations;
    
    // Initialisation du système de suivi des leviers
    this.activatedLevers = {
        levier_2: false,
        levier_3: false,
        levier_4: false,
        levier_1: false
    };
    
    // Compteur de leviers activés pour le panel
    this.activatedLeverCount = 0;
    
    // Initialise le spawn au centre par défaut
    let spawnX = this.map.widthInPixels / 2;
    let spawnY = this.map.heightInPixels / 2;
    
    tab_objects.objects.forEach(point => {
      if (point.name === "spawn") {
        // Utilise la position de l'objet "spawn" pour le spawn du joueur
        spawnX = point.x;
        spawnY = point.y;
      }
      if (point.name === "start") {
        // On conserve les destinations mais on ignore la position de départ
        // this.player.x    = point.x;
        // this.player.y    = point.y;
        // this.spawnPoint.x = point.x;
        // this.spawnPoint.y = point.y;
      }
      if (point.name === "destination") {
        point.properties.forEach(property => {
          if (property.name === "id") {
            const id = parseInt(property.value);
            this.destinations[id] = { x: point.x, y: point.y };
          }
        });
      }
      // Traitement des clés (objets levier_ dans la layer interaction)
      if (point.name.startsWith("levier_")) {
        console.log("Création d'un levier à", point.x, point.y, "avec nom:", point.name);
        // Crée un levier collectible
        var cle = this.physics.add.sprite(point.x, point.y - 25, "levier1");
        cle.body.allowGravity = false;
        cle.setDepth(45);
        // Ajuste la position pour que le levier soit bien centré sur les coordonnées Tiled
        cle.setOrigin(0.5, 0.5);
        // Stocke le nom du levier pour identifier lequel est activé
        cle.leverName = point.name;
        
        // Ajoute les propriétés personnalisées de la clé
        cle.properties = { type: "cle" };
        if (point.properties) {
          point.properties.forEach(property => {
            cle.properties[property.name] = property.value;
          });
        }
        
        // Ajoute la clé au groupe des collectibles
        if (!this.grp_collectibles) {
          this.grp_collectibles = this.physics.add.group();
        }
        this.grp_collectibles.add(cle);
      }
      // Traitement des panels (objets panel dans la layer interaction)
      if (point.name === "panel") {
        console.log("Création d'un panel à", point.x, point.y);
        // Crée un panel
        this.panel = this.physics.add.sprite(point.x, point.y - 33, "panel0");
        this.panel.body.allowGravity = false;
        this.panel.setDepth(45);
        this.panel.setOrigin(0.5, 0.5);
        this.panel.setScale(0.5); // Réduit la taille du panel à 50%
      }
      // Traitement de l'acenseur (objet acenseur dans la layer interaction)
      if (point.name === "acenseur") {
        console.log("Création d'un acenseur à", point.x, point.y);
        // Crée un acenseur
        this.acenseur = this.physics.add.sprite(point.x - 15, point.y - 32, "acenseur");
        this.acenseur.body.allowGravity = false;
        this.acenseur.setDepth(45);
        this.acenseur.setOrigin(0.5, 0.5);
      }
    });

    // Applique les coordonnées du spawn au joueur
    this.player.x = spawnX;
    this.player.y = spawnY;
    this.spawnPoint.x = spawnX;
    this.spawnPoint.y = spawnY;

    // Ennemis et collectibles (items et powerups)
    fct.enemiesCreation.call(this);
    fct.collectiblesCreation.call(this);

    // Portails (créés depuis object_layer, activation via touche W)
    fct.portalsCreation.call(this);

    // Collisions et overlaps physiques
    fct.collisionAndOverLapCreation.call(this);
    fct.setDestinationReachedVictoryCondition.call(this);

    // Textes et zones de message (calque text_layer, optionnel)
    fct.textZonesCreation.call(this);

    // Musique
    this.game.config.sceneTarget = "recto";
    if (this.sound.get("son_intro")) this.sound.stopByKey("son_intro");
    if (this.sound.get('son_game')) {
      this.sound.play('son_game', { loop: true });
    }
  }


  update() {
    if (fct.win.call(this)) {
      this.scene.get('interfaceJeu').launchWinScene();
    }
    if (this.game.config.sceneTarget !== "recto") return;
    if (this.game.config.portalTarget != null) {
      fct.portalSpawning.call(this);
    }
    this.player.update(this.gameplay_layer);
    this.grp_enemy.children.iterate(ennemi => ennemi.update(this.gameplay_layer), this);
  }

  // Gestion de la collision joueur/plateforme en présence d'une échelle
  checkLadderSpecifics(player, platform) {
    if (player.verticalDirection === "up" && player.onLadder) {
      return player.isMoving;
    }
    // Permet de descendre des tuiles grimpables seulement si on est sur une échelle
    if (player.onLadder && this.cursor.down.isDown) {
      const tileDown = this.gameplay_layer.getTileAtWorldXY(player.x, player.getBottomCenter().y + 1);
      if (tileDown && tileDown.properties && tileDown.properties.estGrimpable) {
        return false; // Permet la descente des tuiles grimpables
      }
    }
    return true;
  }

  // Activation d'un portail : vérifie la clé requise puis bascule vers map_verso
  portalActivation(player, portal) {
    if (portal.locked) {
      if (player.playerProperties.isInInventory(portal.requiredKey)) {
        portal.locked = false;
      } else {
        alert(`Portail verrouillé — il vous faut la clef n°${portal.requiredKey}`);
        return;
      }
    }
    this.game.config.portalTarget = portal.target;
    this.game.config.sceneTarget  = "verso";
    // sauvegarde du scale actuel du player avant le switch
    this.game.config.playerScaleBeforeSwitch = this.player.scaleX;
    this.scene.switch("map_verso");
  }
}


