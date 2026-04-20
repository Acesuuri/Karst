import Enemy from "./Enemy.js";
import Item from "./Item.js";



export async function loadFilelistFromDirectory(directory) {
    return new Promise((resolve, reject) => {
        fetch(directory)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Erreur lors du chargement du répertoire : " + response.statusText);
                }
                return response.text();
            })
            .then(html => {
                var parser = new DOMParser();
                var doc = parser.parseFromString(html, "text/html");
                console.log(doc);
                var files = Array.from(doc.querySelectorAll("a"))
                    .map(link => link.getAttribute("href"))
                    .map(name => name.split('/').pop())
                    .filter(name => name.endsWith( "png"))
                  
                resolve(files);
            })
            .catch(error => {
                reject(error);
            });
    });
}


export async function chargerImagesNames(directory) {
    return new Promise((resolve, reject) => {
        fetch(directory)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Erreur lors du chargement du répertoire : " + response.statusText);
                }
                return response.text();
            })
            .then(html => {
                var parser = new DOMParser();
                var doc = parser.parseFromString(html, "text/html");
                console.log(doc);
                var files = Array.from(doc.querySelectorAll("a"))
                    .map(link => link.getAttribute("href"))
                    .map(name => name.split('/').pop())
                    .filter(name => name.startsWith( "portal") || name.startsWith("item"))
                  
                resolve(files);
            })
            .catch(error => {
                reject(error);
            });
    });
}


export async function chargerConfig(configFile) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    var contenu = xhr.responseText;
                    var lignes = contenu.trim().split('\n');

                    var game = {};
                    var player = {};
                    var ennemis = {};
                    var spritesheetConfig = {};

                    for (var i = 0; i < lignes.length; i++) {
                        var ligne = lignes[i].trim();
                        if (ligne === '' || ligne.startsWith('#')) continue; // ignorer lignes vides et commentaires

                        var indexEgal = ligne.indexOf('=');
                        if (indexEgal === -1) {
                            console.log("ligne ignorée (pas de =) : " + ligne);
                            continue;
                        }

                        var partieGauche = ligne.substring(0, indexEgal).trim();
                        var valeurBrute = ligne.substring(indexEgal + 1).trim();

                        // conversion de la valeur : nombre, booléen ou chaîne
                        var valeur;
                        if (valeurBrute === "true") valeur = true;
                        else if (valeurBrute === "false") valeur = false;
                        else if (!isNaN(Number(valeurBrute)) && valeurBrute !== '') valeur = Number(valeurBrute);
                        else valeur = valeurBrute;

                        var segments = partieGauche.split(':');

                        if (segments[0] === 'game' && segments.length === 2) {
                            // game:cle=valeur
                            game[segments[1]] = valeur;
                        }
                        else if (segments[0] === 'player' && segments.length === 2) {
                            // player:cle=valeur
                            player[segments[1]] = valeur;
                        }
                        else if (segments[0] === 'ennemi' && segments.length === 3) {
                            // ennemi:type:cle=valeur
                            var type = segments[1];
                            if (typeof ennemis[type] === 'undefined') ennemis[type] = {};
                            ennemis[type][segments[2]] = valeur;
                        }
                        else if (segments[0] === 'spritesheet' && segments.length === 3) {
                            // spritesheet:nom:cle=valeur
                            var nom = segments[1];
                            if (typeof spritesheetConfig[nom] === 'undefined') spritesheetConfig[nom] = {};
                            spritesheetConfig[nom][segments[2]] = valeur;
                        }
                        else {
                            console.log("ligne ignorée (format inconnu) : " + ligne);
                        }
                    }

                    console.log("Config chargée :", { game, player, ennemis, spritesheetConfig });
                    resolve({ game, player, ennemis, spritesheetConfig });
                } else {
                    reject(new Error("Erreur lors du chargement du fichier : " + xhr.statusText));
                }
            }
        };
        xhr.open('GET', configFile);
        xhr.send();
    });
}

// Définition de la fonction de rappel pour la collision entre les balles et les ennemis
export function hitByABullet2(victime, balle) {
    // Recul de l'ennemi
    // Calcul de la direction de la projection
    var direction = (victime.x < balle.x) ? -1 : 1;

    // Projection de l'ennemi
    var projectionDistance = 20; // Distance de projection
    victime.x += direction * projectionDistance;
    balle.destroy();

    // Rend la victime invincible pendant 3 secondes
    victime.invincible = true;
    this.time.delayedCall(3000, function () {
        victime.invincible = false;
    }, [], this);
}

// Définition de la fonction de rappel pour la collision entre les balles et les ennemis
export function playerHitByABullet(victime, balle) {
    playerHit.call(this, victime, balle);
    balle.destroy();
}

export function enemyHitByABullet(victime, balle) {
    enemyHit.call(this, victime, balle);
    balle.destroy();
}

export function enemyHitByWeapon(weapon, enemy) {
    enemyHit.call(this, enemy, weapon);
}

export function enemyHit(victime, balle) {
    console.log(victime);
    //  alert(victime);
    if (victime.isInvincible() == false) {
        victime.decreaseHealthPoints();
        if (!victime.isDead()) {
            var direction = (victime.x < balle.x) ? -1 : 1;
            // Projection de la victime
            var projectionDistance = 20; // Distance de projection
            victime.x += direction * projectionDistance;
            victime.setInvincible();
        }
        else {
            victime.destroy();
            this.player.addOneKill();

        }
    }
}

export function onDeathLayer(victime, death_layer) {
    do {
        victime.decreaseHealthPoints();
    } while (!victime.isDead() && victime.getLifes() > 0);

    var interfaceScene = this.scene.get('interfaceJeu');
    interfaceScene.afficherCoeurs();

    if (victime.getLifes() > 0) {
        victime.decreaseLife();
        victime.resetHealthPoints();
        interfaceScene.afficherCoeurs();
        //   alert("Vous etes mort. Vous perdez une vie et revenez au dernier chekopint");
        victime.resetStatut();
        victime.x = victime.scene.spawnPoint.x;
        victime.y = victime.scene.spawnPoint.y;
    }
    else {
        // fin du game 
        interfaceScene.scene.stop();
        this.game.config.sceneTarget = "recto";
        this.scene.stop("map_recto");
        this.scene.stop("map_verso");
        this.scene.stop("interface_jeu");
        this.scene.start("lose");
    }
}

export function playerHit(victime, enemy) {
    if (victime.isInvincible() == false) {
        var interfaceScene = this.scene.get('interfaceJeu');
        victime.decreaseHealthPoints();
        interfaceScene.afficherCoeurs();

        if (victime.isDead()) {
            if (victime.getLifes() > 0) {
                victime.decreaseLife();
                victime.resetHealthPoints();
                interfaceScene.afficherCoeurs();
                victime.resetStatut();
                // alert("Vous etes mort. Vous perdez une vie et revenez au dernier chekopint");
                victime.x = victime.scene.spawnPoint.x;
                victime.y = victime.scene.spawnPoint.y;
            }
            else {
                // fin du game 
                gameOver.call(this);


            }
        }
        else {
            var direction = (victime.x < enemy.x) ? -1 : 1;
            // Projection de la victime
            var projectionDistance = 20; // Distance de projection
            victime.x += direction * projectionDistance;
            victime.setInvincible();
        }
    }
}

export function playerHitByAnEnemy(victime, enemy) {
    playerHit.call(this, victime, enemy);
}

export function onKillLayer(victim, kill_layer) {
    playerHit.call(this, victim, kill_layer);
}


export function portalSpawning() {
    var interfaceScene = this.scene.get('interfaceJeu');
    this.player.healthPoints = interfaceScene.playerHealth;
   
    var portalFound = false;

    this.grp_portal.children.iterate(function (portal) {
        // Vérifier si le portail a été trouvé
        if (portal.id == this.game.config.portalTarget) {
            this.spawnPoint.x = portal.x;
            this.spawnPoint.y = portal.y;
            this.player.x = portal.x;
            this.player.y = portal.y;
            this.game.config.portalTarget = null;
            portalFound = true;

            // gestion du scale du player au changement de map
            if (this.game.config.keep_scale_ratio_between_maps && typeof this.game.config.playerScaleBeforeSwitch !== 'undefined') {
                // scale global : on applique le scale qu'avait le player dans la map source
                this.player.setScale(this.game.config.playerScaleBeforeSwitch);
                this.player.body.setSize(this.player.frame.width, this.player.frame.height);
                this.player.body.setOffset(0, 0);
            }
            // sinon : scale propre au niveau, le player garde son scale actuel (persisté par scene.switch)

            interfaceScene.switchLevel();
            return true;
        }
    }, this);
    if (!portalFound) alert("destination inconnue dans map Recto: ");
}

export function win() {
    var interfaceScene = this.scene.get('interfaceJeu');
    return interfaceScene.winningConditionsOK();
}

export function checkDelay(player, zone) {
    return typeof (zone.associated_timer) == 'undefined';
}

export function printMsg(player, zone) {
    zone.associated_text.setVisible(true);
    // Vérifier si un timer est associé à la zone
    if (typeof (zone.associated_timer) == 'undefined') {
        // Créer un nouveau timer s'il n'existe pas
        zone.associated_timer = this.time.delayedCall(3000, function () {
            // Rendre le texte associé invisible après 3 secondes
            zone.associated_text.setVisible(false);
            zone.associated_timer = undefined;
        }, [], this);
    } else {

        // Reset du timer à 3 secondes s'il existe déjà
        zone.associated_timer.reset({ delay: 3000, paused: false });
        console.log(zone.associated_timer);
    }

}

// creation du fond et du fond parallax
export function backgroundCreation( background_image_key,  resultFixed, parallax_background_image_key) {
    if (this.textures.exists(background_image_key)) {
       if (resultFixed == false) {
         this.background_image = this.add.image(0,0, background_image_key).setOrigin(0, 0);   
       }
       else {
            this.background_image = this.add.image(this.game.config.width / 2, this.game.config.height / 2, background_image_key);
             this.background_image.setScrollFactor(0);
       }
    }
    if (this.textures.exists(parallax_background_image_key)) {
        this.fond = this.add.tileSprite(0, 0, this.game.config.width, this.game.config.height, parallax_background_image_key).setOrigin(0, 0);
        this.fond.setScrollFactor(0, 0);
        this.fond.setDepth(5);
    }
}

export function playerCreation() {

}

export function groupsCreation() {
    this.grp_bullet_player = this.physics.add.group({ allowGravity: false });
    this.grp_bullet_enemy = this.physics.add.group({ allowGravity: false });
    this.grp_portal = this.physics.add.staticGroup({ gravityY: 0 });
    this.grp_enemy = this.physics.add.group();
    this.grp_collectibles = this.physics.add.group({ allowGravity: false });

}

//creation des calques usuels : affichage et collision
export function commonLayersCreation() {
    // creation des layers
    this.background = this.map.createLayer("background", [this.tileset, this.tileset_extra], 0, 0);
    this.gameplay_layer = this.map.createLayer("gameplay_layer", [this.tileset, this.tileset_extra], 0, 0);
    this.foreground = this.map.createLayer("foreground", [this.tileset, this.tileset_extra], 0, 0);
    //this.decoration_back_layer = this.map.createLayer("decoration_back_layer", [this.tileset, this.tileset_extra], 0, 0);
   
    // Création du calque grimpable (utilise le même calque gameplay mais avec des propriétés différentes)
    this.grimpable_layer = this.gameplay_layer;
    
    // gestion des profondeurs
    this.background.setDepth(10);
    this.gameplay_layer.setDepth(30);
    this.foreground.setDepth(60); // Mis devant le joueur (joueur a depth 50)
    //this.decoration_front_layer.setDepth(60);
    
    // Configuration des collisions en utilisant la propriété estSolide des tuiles
    this.gameplay_layer.setCollisionByProperty({ estSolide: true });
}

// creation des collectibles (items et powerups) a partir du calque object_layer, si existant
export function collectiblesCreation() {
    if (this.map.getObjectLayerNames().includes("interaction")) {
        const tab_objects = this.map.getObjectLayer("interaction");
        var list_collectibles = tab_objects.objects.filter(function (object) {
            return object.name === "item" || object.name === "powerUp";
        });

        list_collectibles.forEach(collectibleElement => {
            var texture = "item_to_collect";
            var collectible;
            var proprietes = {};
            
            if (typeof (collectibleElement.properties) != 'undefined') {
                collectibleElement.properties.forEach(property => {
                    proprietes[property.name] = property.value;
                }, this);
            }
            
            // Déterminer la texture
            if (collectibleElement.name === "powerUp") {
                texture = "item_" + proprietes.item_type;
            } else {
                // Pour les items simples, ajouter le style particulier si existant
                var style = collectibleElement.properties?.find(property => property.name === "style");
                if (style) {
                    texture = texture + "_" + style.value;
                }
            }
            
            // Créer le collectible avec la texture choisie
            collectible = new Item(this, collectibleElement.x, collectibleElement.y, texture, proprietes);
            this.grp_collectibles.add(collectible);
            collectible.setDepth(49);
        }, this);
    }
    else {
        console.log("calque object_layer non trouvé");
    }
}


// creation des ennemis a partir du calque object_layer, si existant
export function enemiesCreation() {
    console.log("=== ENEMY CREATION DEBUG ===");
    console.log("Available layers:", this.map.getObjectLayerNames());
    if (this.map.getObjectLayerNames().includes("ennemi")) {
        const tab_objects = this.map.getObjectLayer("ennemi");
        console.log("Found ennemie layer with", tab_objects.objects.length, "objects");
        console.log("All object names:", tab_objects.objects.map(obj => obj.name));
        var list_enemies = tab_objects.objects.filter(function (object) {
            return object.name.startsWith("ennemie_") === true;
        });
        console.log("Found", list_enemies.length, "enemies starting with 'ennemie_'");
        if (list_enemies.length === 0) {
            console.log("WARNING: No ennemie_ objects found! Check your Tiled map object layer names.");
        }
        list_enemies.forEach(enemyElement => {
            console.log("DEBUG: Creating enemy at", enemyElement.x, enemyElement.y, "with name:", enemyElement.name);
            var enemy;
            var proprietes = {};
            // Force tous les ennemis à être de type 1
            var type = 1;
            console.log("DEBUG: Enemy type forced to:", type);
            proprietes.type = type;
            if (typeof (enemyElement.properties) != 'undefined') {
                enemyElement.properties.forEach(property => {
                    proprietes[property.name] = property.value;
                }, this);
            }
            // Check if required texture exists before creating enemy
            const textureKey = "enemy_" + type + "_move_right_SS";
            console.log("DEBUG: Checking texture:", textureKey);
            console.log("DEBUG: Texture exists:", this.textures.exists(textureKey));
            console.log("DEBUG: Available textures:", Object.keys(this.textures.list));
            
            enemy = new Enemy(this, enemyElement.x, enemyElement.y - 20, proprietes);
            console.log("DEBUG: Enemy created:", enemy);
            console.log("DEBUG: Enemy position after creation:", enemy.x, enemy.y);
            console.log("DEBUG: Enemy visible:", enemy.visible);
            console.log("DEBUG: Enemy active:", enemy.active);
            console.log("DEBUG: Enemy depth:", enemy.depth);
            this.grp_enemy.add(enemy);
            console.log("DEBUG: Enemy added to group, group size:", this.grp_enemy.getChildren().length);
            if (type == 4) enemy.body.setAllowGravity(false);

            enemy.setDepth(49);
            enemy.initiateMobility();
            console.log("DEBUG: Enemy initialized, final position:", enemy.x, enemy.y);

        }, this);
    }
    else {
        console.log("calque object_layer non trouvé");
    }
}

// verifie si un joueur est superpose à une tuile existante d'un calque
export function checkLayoutOverlapWithTiles(player, tile) {
    const layer = tile.tilemapLayer;
    const playerTileUp = layer.getTileAtWorldXY(player.x, player.getTopCenter().y + 1);
    const playerTileDown = layer.getTileAtWorldXY(player.x, player.getBottomCenter().y - 1);
    if (playerTileUp || playerTileDown) {
        return true;
    }
    return false;
}

export function worldsBoundsAndCameraConfiguration() {
    // redimentionnement du monde avec les dimensions calculées via tiled
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    //  ajout du champs de la caméra de taille identique à celle du monde
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    // ancrage de la caméra sur le joueur
    this.cameras.main.startFollow(this.player);
}

export function collectibleCollect(player, item) {
    // Ignore les leviers (ceux qui ont la propriété leverName)
    if (item.leverName) {
        return;
    }
    
    item.disableBody(true, true);

    // Gestion des powerups (items avec item_type)
    if (typeof item.proprietes.item_type !== 'undefined') {
        switch (item.proprietes.item_type) {
            case "jump":
                player.increaseJumpHeight(item.proprietes.item_effect);
                break;
            case "double_jump":
                player.enableDoubleJump();
                break;
            case "triple_jump":
                player.enableTripleJump();
                break;
            case "wall_jump":
                player.enableWallJump();
                break;
            case "fly":
                player.enableFlying();
                break;
            case "change":
                player.setNewLook(item.proprietes);
                break;
            case "speed":
                player.increaseSpeed(item.proprietes.item_effect);
                break;
            case "reset" :
                player.resetPowerUps();
                break;
            case "shoot":
                player.enableShooting();
                break;
            case "long_shot":
                player.increaseProjectileLength(item.proprietes.item_effect);
                break;
            case "scale":
                player.setAbsoluteScale(item.proprietes.item_effect);
                break;
            case "scaleFactor":
                player.applyScaleFactor(item.proprietes.item_effect);
                break;
        }
        // Mise en pause la scène actuelle et de l'interface (chronomètre)
        this.scene.pause();
        this.scene.get('interfaceJeu').scene.pause();
        // Lancement la scène dialogBox
        this.scene.launch('dialogBox', { proprietes: item.proprietes, sceneToResume: this.scene.key });
    } else {
        // Gestion des items simples
        player.collectItem(item);
        if (item.getType() == "collect") {
            var interfaceScene = this.scene.get('interfaceJeu');
            interfaceScene.updateItems();
        }
        if (item.getType() == "hearth") {
            var interfaceScene = this.scene.get('interfaceJeu');
            interfaceScene.afficherCoeurs();
        }

        if (item.getType() == "key") {
            player.playerProperties.addToInventory(item.proprietes.id);
        }

        item.destroy();
    }
}

export function collisionAndOverLapCreation() {
    // collisions
    this.physics.add.collider(this.player, this.gameplay_layer, null, this.checkLadderSpecifics, this);
    this.physics.add.collider(this.grp_enemy, this.gameplay_layer);
    this.physics.add.overlap(this.grp_enemy, this.grp_bullet_player, enemyHitByABullet, null, this);
    this.physics.add.overlap(this.player, this.grp_bullet_enemy, playerHitByABullet, null, this);
    this.physics.add.overlap(this.player, this.grp_enemy, playerHitByAnEnemy, null, this);
    this.physics.add.overlap(this.player, this.grp_collectibles, collectibleCollect, null, this);
    
    // Collision spécifique pour les leviers
    this.physics.add.overlap(this.player, this.grp_collectibles, activateLever, null, this);
    
    // Collision avec l'acenseur pour vérifier si tous les leviers sont activés
    if (this.acenseur) {
        this.physics.add.overlap(this.player, this.acenseur, checkAcenseurWin, null, this);
    }

    // collision si arme de poing
    if (this.player.closeCombat == true) {
        this.physics.add.overlap(this.player.weapon, this.grp_enemy, enemyHitByWeapon, null, this);
    }
}

export function checkAcenseurWin(player, acenseur) {
    console.log("Joueur touche l'acenseur");
    
    // Vérifie si tous les leviers sont activés
    if (this.activatedLevers['levier_1'] && 
        this.activatedLevers['levier_2'] && 
        this.activatedLevers['levier_3'] && 
        this.activatedLevers['levier_4']) {
        console.log("Tous les leviers sont activés - Victoire via acenseur !");
        // Lance la scène de victoire
        this.scene.get('interfaceJeu').launchWinScene();
    } else {
        console.log("Tous les leviers ne sont pas encore activés");
    }
}

export function activateLever(player, lever) {
    // Vérifie si c'est un levier (a la propriété leverName)
    if (lever.leverName) {
        console.log("[DEBUG] Tentative d'activation du levier:", lever.leverName);
        console.log("[DEBUG] État actuel des leviers:", this.activatedLevers);
        
        // Vérifie si le levier est déjà activé pour éviter de le réactiver
        if (this.activatedLevers[lever.leverName]) {
            console.log("[DEBUG] Le levier", lever.leverName, "est déjà activé, annulation");
            return;
        }
        
        console.log("[DEBUG] Activation du levier:", lever.leverName);
        
        // Joue le son du levier
        this.sound.play("son_lever");
        
        // Marque le levier comme activé
        this.activatedLevers[lever.leverName] = true;
        
        // Incrémente le compteur de leviers activés
        this.activatedLeverCount++;
        
        // Change l'apparence du levier pour montrer qu'il est activé
        lever.setTint(0x00FF00); // Vert pour indiquer l'activation
        
        // Change la texture du panel en fonction du nombre de leviers activés
        if (this.panel) {
            // Utilise le compteur pour déterminer la texture (panel0, panel1, panel2, etc.)
            this.panel.setTexture('panel' + this.activatedLeverCount);
            console.log("[DEBUG] Texture du panel changée en: panel" + this.activatedLeverCount + " (leviers activés: " + this.activatedLeverCount + ")");
        }
        
        // Si c'est levier_1, vérifie si les 3 autres sont activés
        if (lever.leverName === 'levier_1') {
            if (this.activatedLevers['levier_2'] && 
                this.activatedLevers['levier_3'] && 
                this.activatedLevers['levier_4']) {
                console.log("Tous les leviers sont activés - Victoire !");
                // Lance la scène de victoire
                this.scene.get('interfaceJeu').launchWinScene();
            } else {
                console.log("Les autres leviers ne sont pas encore activés");
            }
        }
    }
}

export function setDestinationReachedVictoryCondition() {
    if (this.map.getObjectLayerNames().includes("interaction")) {
        const tab_objects = this.map.getObjectLayer("interaction");

        // Creation de la destination target  :
        tab_objects.objects.forEach(point => {
            if (point.name == "target") {
                var target = this.physics.add.sprite(point.x, point.y, "destination");
                target.body.allowGravity = false;
                target.setDepth(49);
                this.physics.add.overlap(this.player, target, function (player, target) {
                    player.setDestinationReached(true);
                    // Détecter quand ils ne se superposent plus
                    this.time.delayedCall(100, function () {
                        if (!this.physics.overlap(player, target)) {
                            // Les sprites ne se superposent plus
                            player.setDestinationReached(false);
                        }
                    }, [], this);
                }, null, this);
            }
        }
        );
    }
}

export function gameOver() {
    var interfaceScene = this.scene.get('interfaceJeu');
    interfaceScene.scene.stop();
    this.game.config.sceneTarget = "recto";
    this.scene.stop("map_recto");
    this.scene.stop("map_verso");
    this.scene.stop("interface_jeu");
    this.scene.start("lose");
}

// =================================================================================
// FONCTIONS COMMUNES AUX CARTES (map_recto et map_verso)
// Ces fonctions utilisent .call(this) pour être exécutées dans le contexte de la scène.
// =================================================================================

/**
 * Crée les portails depuis le calque object_layer.
 * Chaque portail lit ses propriétés (id, target, style, clé requise) et configure
 * l'overlap avec le joueur pour déclencher this.portalActivation().
 */
export function portalsCreation() {    const tab_objects = this.map.getObjectLayer("interaction");
    if (!tab_objects) return;

    tab_objects.objects.forEach(point => {
        if (point.name !== "portal") return;

        const props = {};
        const pointProperties = Array.isArray(point.properties) ? point.properties : [];
        pointProperties.forEach(property => { props[property.name] = property.value; });

        const styledTexture = typeof props.style !== 'undefined' ? `portal_${props.style}` : "portal";
        const texture = this.textures.exists(styledTexture) ? styledTexture : "portal";
        const portal  = this.physics.add.sprite(point.x, point.y, texture);
        portal.id     = props.id;
        portal.target = props.target;
        portal.locked = typeof props.key !== 'undefined';
        if (portal.locked) portal.requiredKey = props.key;

        portal.body.allowGravity = false;
        portal.setVisible(true);
        portal.setActive(true);
        portal.setDepth(47);
        this.grp_portal.add(portal);

        // L'activation est déclenchée par la touche d'action (W par défaut)
        this.physics.add.overlap(
            this.player, portal,
            this.portalActivation,
            () => Phaser.Input.Keyboard.JustDown(this.actionKey),
            this
        );
    });
}

/**
 * Crée les textes et zones de message depuis le calque text_layer (optionnel).
 * Un texte est rendu visible quand le joueur entre dans la zone associée.
 */
export function textZonesCreation() {
    const layer = this.map.getObjectLayer("text_layer");
    if (!layer) return;

    const list_texts = layer.objects.filter(o => o.name === "text");
    const list_zones = layer.objects.filter(o => o.name === "zone");

    // Création des objets texte (initialement invisibles)
    const tab_texts = [];
    list_texts.forEach(txtElement => {
        const texteObject = this.add.text(
            txtElement.x, txtElement.y,
            txtElement.text.text,
            {
                fontFamily: txtElement.text.fontfamily,
                fontSize:   txtElement.text.pixelsize,
                color:      txtElement.text.color ?? "#000000",
            }
        );
        txtElement.properties.forEach(property => {
            if (property.name === "id") texteObject.id = property.value;
        });
        tab_texts[texteObject.id] = texteObject;
        texteObject.setVisible(false);
        texteObject.setDepth(200);
    });

    // Création des zones physiques et association avec les textes
    list_zones.forEach(zoneElement => {
        const zoneObject = this.add.zone(zoneElement.x, zoneElement.y)
            .setOrigin(0, 0)
            .setSize(zoneElement.width, zoneElement.height);
        this.physics.world.enable(zoneObject, 0); // 0 = DYNAMIC
        zoneObject.body.setAllowGravity(false);
        zoneObject.body.moves = false;
        zoneElement.properties.forEach(property => {
            if (property.name === "id_text") {
                zoneObject.associated_text = tab_texts[property.value];
            }
        });
        this.physics.add.overlap(this.player, zoneObject, printMsg, checkDelay, this);
    });
}
