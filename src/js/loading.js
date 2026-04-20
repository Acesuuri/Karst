import * as fct from "./fonctions.js";
import accueil from "./accueil.js";
import credits from "./credits.js";
import controls from "./controls.js";
import map_recto from "./map_recto.js";
import story from "./story.js";
import lose from "./lose.js";
import win from "./win.js";
import Player from "./Player.js";
import interfaceJeu from "./interfaceJeu.js";
import dialogBox from "./dialogBox.js";

// extraction des éléments du fichier de configuration
var { game: gameConfig, player: playerConfig, ennemis: ennemisConfig, spritesheetConfig: spritesheetRawConfig } = await fct.chargerConfig('./src/assets/config.txt');
// liste des fichiers du répertoire image (hardcoded pour éviter l'erreur 404)
var imgFilesName = [
    'portal.png',
    'item_to_collect.png',
    'item_to_collect_classic.png',
    'item_to_collect_modern.png',
    'item_to_collect_retro.png'
];
// liste des fichiers du répertoire spritesheet (hardcoded pour éviter l'erreur 404)
var spritesheetsFilesName = [
    'enemy_1_move_right_spritesheet.png',
    'enemy_death.png',
    'player_jump_right_spritesheet.png',
    'player_move_right_spritesheet.png',
    'player_shoot_right_spritesheet.png',
    'player_stand_right_spritesheet.png',
    'generateur_1.png',
    'levier.png',
    'acenseur_1.png'
]; 


export default class loading extends Phaser.Scene {
    // constructeur de la classe
    constructor() {
        super({
            key: "loading" //  ici on précise le nom de la classe en tant qu'identifiant
        });
        
    }
    
    
    
    preload() {
        console.log("ci");
        console.log(imgFilesName) ;
        
        imgFilesName.forEach(fileName => {
            const key = fileName.split('.').slice(0, -1).join('.');
            this.load.image(key, `./src/assets/images/${fileName}`);
        });
        
        // chargement de toutes les images du répertoire spritesheet
        spritesheetsFilesName.forEach(fileName => {
            const baseKey = fileName.split('.').slice(0, -1).join('.');
            const key = baseKey.replace(/_spritesheet$/, '');
            
            console.log("fichier a charger : " + key + "sur fichier "+ fileName)
            
            this.load.image(key, `./src/assets/spritesheets/${fileName}`);
            
            
        }, this);
        
        /* chargement des boutons */
        this.load.image("button_credits", "src/assets/images/button_credits.png");
        this.load.image("button_back", "src/assets/images/button_back.png");
        this.load.image("button_play", "src/assets/images/button_play.png");
        this.load.image("button_controls", "src/assets/images/button_controls.png");
        
        /* chargement des screens de fond */
        this.load.image("screen_welcome", "src/assets/images/screen_welcome.png");
        this.load.image("screen_controls", "src/assets/images/screen_controls.png");
        this.load.image("screen_credits", "src/assets/images/screen_credits.png");
        this.load.image("screen_story", "src/assets/images/screen_story.png");
        this.load.image("screen_win", "src/assets/images/screen_win.png");
        this.load.image("screen_lose", "src/assets/images/screen_lose.png");
        /* chargement des autres textures */
        this.load.image("bullet", "src/assets/images/bullet.png");
        this.load.image("levier1", "src/assets/images/levier1.png");
        this.load.image("panel0", "src/assets/images/panel0.png");
        this.load.image("panel1", "src/assets/images/panel1.png");
        this.load.image("panel2", "src/assets/images/panel2.png");
        this.load.image("panel3", "src/assets/images/panel3.png");
        this.load.image("panel4", "src/assets/images/panel4.png");
        this.load.image("panel5", "src/assets/images/panel5.png");
        this.load.image("acenseur", "src/assets/images/acenseur.png");
        
        // Écouter l'événement d'erreur de chargement
        this.load.on('loaderror', (file) => {
            if (file.key === "item_doubleJump") {
                console.warn("Fichier introuvable ou erreur de chargement : src/assets/images/item_doubleJump.png");
            }
        });
        
        this.load.image("item_hearth", "src/assets/images/item_hearth.png");
        
        this.load.image("coeur", "src/assets/images/coeur.png");
        
        /* chargement des sons */
        this.load.audio("son_bullet", "src/assets/sounds/son_bullet.mp3");
        this.load.audio("son_lever", "src/assets/sounds/son_lever.mp3");
        this.load.audio("son_game_over", "src/assets/sounds/son_game_over.mp3");
        this.load.audio("son_win", "src/assets/sounds/son_win.mp3");
        this.load.audio("son_game", "src/assets/sounds/son_game.mp3");
        this.load.audio("son_intro", "src/assets/sounds/son_intro.mp3");
        
        /* chargement des cartes */
        this.load.tilemapTiledJSON('map_recto', './src/assets/maps/Karst.json');
        this.load.image('tileset_image', './src/assets/maps/grande_tuilev2.png');
        this.load.image('tileset_image_extra', './src/assets/maps/tuile_cartev2.png');
        
    }
    create() {
        // chargement des caractéristiques du player
        this.game.config.player_closeCombat = false;
        if (playerConfig) {
            if (playerConfig.closeCombat === true) {
                this.game.config.player_closeCombat = true;
            }
            // parcours des éléments de configuration pour player et ajout dans game.config
            var playerConfigNamesTable = ["speed", "jumpHeight", "gravity", "projectileDuration", "projectileSpeed", "coolDownDuration", "maxHealth", "lifes", "canShoot"];      
            playerConfigNamesTable.forEach(function (paramName, index) { 
                if (typeof (playerConfig[paramName]) != 'undefined') {
                    this.game.config["player_"+paramName] = playerConfig[paramName];
                }
            }, this);
            
        }
        // chargement des conditions de victoire du jeu 
        if (gameConfig) {
            this.game.config.objective_kill_them_all = gameConfig.objective_kill_them_all === true;
            this.game.config.objective_collect_all_items = gameConfig.objective_collect_all_items === true;
            this.game.config.objective_reach_destination = gameConfig.objective_reach_destination === true;
            
            // objectif : terminer dans le temps imparti (désactivé)
            // if (gameConfig.objective_complete_in_time === true && typeof gameConfig.objective_max_time !== 'undefined') {
            //     this.game.config.objective_complete_in_time = true;
            //     this.game.config.objective_max_time = gameConfig.objective_max_time;
            // }
            // else this.game.config.objective_complete_in_time = false;
            
            // Désactivation complète de l'objectif temps
            this.game.config.objective_complete_in_time = false;
            
            // Chargement des fonds d'écran totaux pour recto et verso
            this.game.config.fixedBackgroundRecto = gameConfig.fixedBackgroundRecto === true;
            this.game.config.fixedBackgroundVerso = gameConfig.fixedBackgroundVerso === true;
            
            console.log("objectifs chargés :");
            console.log("- kill them all : " + this.game.config.objective_kill_them_all);
            console.log("- collect all item : " + this.game.config.objective_collect_all_items);
            console.log("- reach destination : " + this.game.config.objective_reach_destination);   
        }
        else console.log("Aucun objectif trouvé");
        
        // configuration du scale du player par map
        this.game.config.initial_scale_recto = (gameConfig && typeof gameConfig.initial_scale_recto !== 'undefined') ? gameConfig.initial_scale_recto : 1;
        this.game.config.initial_scale_verso = (gameConfig && typeof gameConfig.initial_scale_verso !== 'undefined') ? gameConfig.initial_scale_verso : 1;
        this.game.config.keep_scale_ratio_between_maps = !(gameConfig && gameConfig.keep_scale_ratio_between_maps === false);
        
        // stockage de la config ennemis pour usage ultérieur
        this.game.config.ennemisConfig = ennemisConfig;
        
        
        // chargement et calcul des dimensions des spritesheets
            // on calcule SpriteSheetNamesTable à partir de spritesheetsFilesName : on enleve _spritesheet.png à la fin de chaque entrée de spritesheetsFilesName
            var SpriteSheetNamesTable = spritesheetsFilesName.map(name => name.replace("_spritesheet.png", ""));
            
            var spritesheetConfig = {};
            console.log("fichier spritesheet :");
            console.log(spritesheetsFilesName);
            console.log(SpriteSheetNamesTable);
            console.log("DEBUG: enemy_death dans SpriteSheetNamesTable:", SpriteSheetNamesTable.includes('enemy_death'));
            
            // creation des spritesheet a partir des images et des informations de spritesheetRawConfig
            SpriteSheetNamesTable.forEach(function (ss_name, index) {
                
                if (this.textures.exists(ss_name)) { // la texture est chargée
                    if(typeof spritesheetRawConfig[ss_name] !== 'undefined') { 
                        // des elements de configuration ont été trouvé dans config.txt  
                        // chargements des elements de configuration de spritesheet dans le registry               
                        spritesheetConfig[ss_name] = {};                
                        spritesheetConfig[ss_name].nbFrames = spritesheetRawConfig[ss_name].nbFrames;
                        spritesheetConfig[ss_name].frameDuration = spritesheetRawConfig[ss_name].frameDuration || 100;
                        spritesheetConfig[ss_name].width = this.textures.get(ss_name).getSourceImage().width;
                        spritesheetConfig[ss_name].height = this.textures.get(ss_name).getSourceImage().height;
                        spritesheetConfig[ss_name].frameWidth = spritesheetConfig[ss_name].width / spritesheetConfig[ss_name].nbFrames;
                        spritesheetConfig[ss_name].frameHeight = spritesheetConfig[ss_name].height;
                        this.textures.addSpriteSheet(ss_name + '_SS', this.textures.get(ss_name).getSourceImage(), { frameWidth: spritesheetConfig[ss_name].frameWidth, frameHeight: spritesheetConfig[ss_name].frameHeight });
                        console.log("[debug] ajout du spritesheet " + ss_name + "_SS - dimensions:  [" + spritesheetConfig[ss_name].frameWidth + ";" + spritesheetConfig[ss_name].frameHeight+"]");
                        this.anims.create({
                            key: 'anim_' + ss_name,
                            frames: this.anims.generateFrameNumbers(ss_name + '_SS', { start: 0, end: spritesheetRawConfig[ss_name].nbFrames - 1 }),
                            duration: spritesheetConfig[ss_name].frameDuration * spritesheetConfig[ss_name].nbFrames
                        });
                        console.log("[debug] ajout de l'animation " + ss_name + "_SS - dimensions:  [" + spritesheetConfig[ss_name].frameWidth + ";" + spritesheetConfig[ss_name].frameHeight+"]");
                        
                    console.log("creation de l'animation " + 'anim_' + ss_name + " avec  " + spritesheetRawConfig[ss_name].nbFrames + " frames");
                    if (ss_name === 'enemy_death') {
                        console.log("[DEBUG] Animation enemy_death créée avec clé: anim_enemy_death");
                    }
                    }
                    else {

                    }
                }
                else {
                    console.log ("[error] texture non trouvée : " + ss_name);
                    console.log ("[error] note : cette configuration ne devrait pas arriver!");
                    
                }
            }, this);
            
            // stockage des spritesheets dans le registry Phaser (accessible depuis toutes les scènes)
            this.registry.set('spritesheetConfig', spritesheetConfig);
            
            // Création manuelle de l'animation de mort des ennemis
            if (this.textures.exists('enemy_death') && spritesheetConfig['enemy_death']) {
                this.textures.addSpriteSheet('enemy_death_SS', this.textures.get('enemy_death').getSourceImage(), { 
                    frameWidth: spritesheetConfig['enemy_death'].width / spritesheetConfig['enemy_death'].nbFrames, 
                    frameHeight: spritesheetConfig['enemy_death'].height 
                });
                
                this.anims.create({
                    key: 'anim_enemy_death',
                    frames: this.anims.generateFrameNumbers('enemy_death_SS', { start: 0, end: spritesheetConfig['enemy_death'].nbFrames - 1 }),
                    duration: spritesheetConfig['enemy_death'].frameDuration * spritesheetConfig['enemy_death'].nbFrames,
                    repeat: 0
                });
                console.log("[DEBUG] Animation de mort enemy_death créée avec succès");
            } else {
                console.warn("[WARN] Impossible de créer l'animation enemy_death - texture ou config manquante");
            }
            
            // Test pour afficher les noms des fichiers item_to_collect_*** chargés
            const loadedItemToCollectFiles = Object.keys(this.textures.list).filter(textureName => textureName.startsWith("item_to_collect_"));
            console.log("Fichiers item_to_collect_*** chargés :", loadedItemToCollectFiles);
            
            this.game.config.default_gravity = this.physics.world.gravity.y;
            
            // ajout des sons
            
            if (this.cache.audio.exists("son_bullet")) {
                this.game.config.son_bullet = this.sound.add("son_bullet");
            } else {
                console.warn("Audio file 'son_bullet' not loaded properly.");
            }
            if (this.cache.audio.exists("son_jump")) {
                this.game.config.son_jump = this.sound.add("son_jump");
            } else {
                console.warn("Audio file 'son_jump' not loaded properly.");
            }
            if (this.cache.audio.exists("son_item")) {
                this.game.config.son_item = this.sound.add("son_item");
            } else {
                console.warn("Audio file 'son_item' not loaded properly.");
            }
            
            if (this.cache.audio.exists("son_game")) {
                this.game.config.son_game = this.sound.add("son_game");
            }
            else {
                console.warn("Audio file 'son_game' not loaded properly.");
            }
            if (this.cache.audio.exists("son_game_over")) {
                this.game.config.son_game_over = this.sound.add("son_game_over");
            } else {
                console.warn("Audio file 'son_game_over' not loaded properly.");
            }
            if (this.cache.audio.exists("son_win")) {
                this.game.config.son_win = this.sound.add("son_win");
            } else {
                console.warn("Audio file 'son_win' not loaded properly.");
            }
            if (this.cache.audio.exists("son_game")) {
                this.game.config.son_game = this.sound.add("son_game");
            } else {
                console.warn("Audio file 'son_game' not loaded properly.");
            }
            
            if (this.cache.audio.exists("son_intro")) {
                this.game.config.son_game = this.sound.add("son_intro");
            } else {
                console.warn("Audio file 'son_intro' not loaded properly.");
            }
            
            // chargement des scenes
            this.scene.add('accueil', accueil, false);
            this.scene.add('credits', credits, false);
            this.scene.add('controls', controls, false);
            this.scene.add('story', story, false);
            this.scene.add('lose', lose, false);
            this.scene.add('win', win, false);
            this.scene.add('map_recto', map_recto, false);
            this.scene.add('dialogBox', dialogBox, false);
            
            // chargement de la map recto pour extraction du nombre d'item / monster
            var map = this.make.tilemap({ key: 'map_recto' });
            var tab_objects = map.getObjectLayer("interaction");
            var remainingItems = 0;
            var remainingMonsters = 0;
            tab_objects.objects.forEach(point => {
                if (point.name.startsWith("ennemie_")) {
                    remainingMonsters++;
                }
                if (point.name.startsWith("levier_")) {
                    if (typeof (point.properties) == 'undefined' || point.properties[0].name != "type") {
                        remainingItems++;
                    }
                }
            }, this);
            
            // chargement de l'interface de jeu avec les parametres de victoire
            this.scene.add('interfaceJeu', interfaceJeu, false, { remainingMonsters: remainingMonsters, remainingItems: remainingItems });
            
            
            // lancement du jeu
            this.scene.start("accueil");
            
        }
        
        update() {
        }
    }
    
