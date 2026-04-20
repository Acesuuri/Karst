export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, textureKey) {
        // Initialisation du joueur et de ses propriétés
        super(scene, x, y, textureKey);
        this.interface = this.scene.scene.get('interfaceJeu');
        // la plupart des proprietes sont dans l'objet playerProperties
        this.playerProperties = this.interface.playerProperties;

        // Physique du joueur
        scene.add.existing(this);
        scene.physics.world.enable(this); // Active la physique pour le joueur
        this.refreshBody();
        this.setBounce(0.2);
        this.setCollideWorldBounds(true);
        this.setDepth(50);
        this.body.setMaxVelocityY(400);

        // origine en bas-centre : les pieds du joueur sont toujours au point (x, y)
        this.setOrigin(0.5, 1);
        // hitbox initiale basée sur la texture de départ
        this.body.setSize(this.frame.width, this.frame.height);
        this.body.setOffset(0, 0);

        // adapter la hitbox automatiquement à chaque changement d'animation
        this.on('animationstart', () => {
            this.body.setSize(this.frame.width, this.frame.height);
            this.body.setOffset(0, 0);
        });

        if (typeof (this.scene.game.config.player_gravity) != 'undefined') {
            this.gravity = this.scene.game.config.player_gravity - this.scene.physics.world.gravity.y;
        }
        else this.gravity = 300;
        //  this.body.gravity.y = this.gravity;

        this.direction = "right";
        this.isShooting = false;
        this.isMoving = true;
        this.isJumping = false;
        this.remainingJump = 1;
        this.playerProperties.baseRemainingJump = 1;
        this.onLadder = false;
        this.justCrossingPortal = false;
        this.invincible = false;
        this.hasDoubleJumped = false; 

        // gestion de l'arme
        this.closeCombat = this.scene.game.config.player_closeCombat;

        if (this.closeCombat == true) {
            this.weapon = this.scene.physics.add.sprite(this.x, this.y, 'bullet');
            this.weapon.setVisible(false);
            this.weapon.setSize(40, 8);
            this.weapon.setOrigin(0, 0);
            this.weapon.body.allowGravity = false;
            this.weapon.disableBody(true, true);
            this.weapon.setDepth(49);
        }


        this.body.setCollideWorldBounds(true); // Empêche le joueur de sortir des limites du monde
        this.body.setBounce(0.2); // Rebondissement lorsque le joueur heurte quelque chose (facultatif)
        this.body.setGravityY(300); // Gravité du joueur (facultatif, dépend du jeu)

        // Configuration des touches de déplacement
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.jumpKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
        this.fireKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);

        if (scene.sys.settings.key == "map_recto") {

        }

   
        this.itemCollected = 0;
        if (this.scene.mapReversed == true) {
            this.coefDirection = -1;
        }
        else {
            this.coefDirection = 1;
        }

    }

    // === Gestion des attributs liés au mouvement ===

    /**
     * Retourne la vitesse actuelle du joueur.
     */
    getSpeed() {
        return this.playerProperties.speed;
    }

    /**
     * Retourne l'accélération actuelle du joueur.
     */
    getAcceleration() {
        return this.playerProperties.acceleration;
    }

    /**
     * Retourne la hauteur de saut actuelle du joueur.
     */
    getJumpHeight() {
        return this.playerProperties.jumpHeight;
    }

    /**
     * Augmente la hauteur de saut du joueur.
     * @param {number} increaseHeightValue - Valeur d'augmentation.
     */
    increaseJumpHeight(increaseHeightValue) {
        this.playerProperties.jumpHeight += increaseHeightValue;
    }

    /**
     * Augmente la distance de tir .
     * @param {number} increaseLengthValue - Valeur d'augmentation.
     */
    increaseProjectileLength(increaseLengthValue) {
        this.playerProperties.projectileDistance += increaseLengthValue;
    }

 
    /**
     * Augmente la vitesse du joueur.
     * @param {number} increaseSpeedValue - Valeur d'augmentation.
     */
    increaseSpeed(increaseSpeedValue) {  
        this.playerProperties.speed += increaseSpeedValue;
     }

    // === Gestion des attributs liés au combat ===

    /**
     * Retourne la durée de vie des projectiles.
     */
    getProjectileDuration() {
      return this.playerProperties.projectileDistance / this.playerProperties.projectileSpeed * 1000
    }

    /**
     * Retourne la vitesse des projectiles.
     */
    getProjectileSpeed() {
        return this.playerProperties.projectileSpeed;
    }

    /**
     * Retourne la durée de rechargement entre deux tirs.
     */
    getCoolDownDuration() {
        return this.playerProperties.coolDownDuration;
    }

    /**
     * Gère l'action de tir (corps à corps ou à distance).
     */
    fire() {
        // Ajout du son lors du tir
        if (!this.scene.sound.get('son_bullet')) {
            console.warn("Le son 'son_bullet' n'est pas chargé dans la scène.");
        } else {
            this.scene.sound.play('son_bullet');
        }
        // attaque au corps à corps
        if (this.closeCombat == true) {
            this.weapon.enableBody(true, this.x, this.y - this.body.height / 2, true, true);
            this.weaponEnabled = true;
            this.scene.time.delayedCall(500, function () {
                this.weapon.disableBody(true, true);
                this.weaponEnabled = false;
            }, [], this);
        }
        // attaque a distance
        else {
            var projectile;
            var projectileY = this.y - this.body.height / 2;
            if (this.scene.anims.exists("anim_projectile_player")) {
                projectile = this.scene.physics.add.sprite(this.x, projectileY, 'projectile_player_SS');
            }
            else
                projectile = this.scene.physics.add.sprite(this.x, projectileY, 'bullet');
            this.scene.grp_bullet_player.add(projectile);
            projectile.body.allowGravity = false;
            projectile.setDepth(50);
            projectile.setVelocityX(this.getProjectileSpeed());
            // direction et texture du projectile en fonction de l'orientation du joueur
            if (this.flipX == true) {
                projectile.setVelocityX(-this.getProjectileSpeed());
                projectile.flipX = true;
                projectile.x = projectile.x - this.scene.registry.get('spritesheetConfig')["player_shoot_right"].width / (2 * this.scene.registry.get('spritesheetConfig')["player_shoot_right"].nbFrames);
            }
            else {
                projectile.x = projectile.x + this.scene.registry.get('spritesheetConfig')["player_shoot_right"].width / (2 * this.scene.registry.get('spritesheetConfig')["player_shoot_right"].nbFrames);
            }
            // lancement de l'animation du spritesheet projectile si elle existe
            if (this.scene.anims.exists("anim_projectile_player")) {
                projectile.anims.play({ key: "anim_projectile_player", repeat: -1 })
            }
            // destruction du projectile après un certain délai
            this.scene.time.delayedCall(this.getProjectileDuration(), function () {
                projectile.destroy();
            }, [], this);
        }
    }

    // === Gestion de la santé ===

    /**
     * Retourne les points de vie actuels du joueur.
     */
    getHealth() {
        return this.playerProperties.health;
    }

    /**
     * Diminue les points de vie du joueur.
     */
    decreaseHealthPoints() {
        this.playerProperties.health--;
    }

    /**
     * Augmente les points de vie du joueur si ce n'est pas au maximum.
     */
    increaseHealthPoints() {
        if (this.getHealth() < this.getMaxHealth()) {
            this.playerProperties.health++;
        }
    }

    /**
     * Réinitialise les points de vie du joueur à leur maximum.
     */
    resetHealthPoints() {
        this.playerProperties.health = this.playerProperties.maxHealth;
    }

    /**
     * Retourne le maximum de points de vie du joueur.
     */
    getMaxHealth() {
        return this.playerProperties.maxHealth;
    }

    /**
     * Augmente le maximum de points de vie du joueur.
     */
    increaseMaxHealthPoints() {
        this.playerProperties.maxHealth++;
    }

    /**
     * Rend le joueur invincible temporairement.
     */
    setInvincible() {
        this.invincible = true;
        this.setTint("0xFF0000")
        // Activer l'animation de clignotement
        this.blinkAnimation = this.scene.tweens.add({
            targets: this,
            alpha: 0.3, // Baisser l'opacité à 50%
            duration: 150, // Durée d'une itération de clignotement
            ease: 'Linear',
            repeat: -1, // Répéter indéfiniment
            yoyo: true // Inverser l'animation (pour que le sprite clignote)
        });
        // Timer pour revenir à l'état normal après 3 secondes
        this.scene.time.delayedCall(3000, () => {
            this.invincible = false;
            this.clearTint();
            this.alpha = 1; // Remettre l'opacité à 100%
            this.blinkAnimation.stop(); // Arrêter l'animation de clignotement
        }, [], this);
    }

    /**
     * Vérifie si le joueur est invincible.
     */
    isInvincible() {
        return this.invincible;
    }

    /**
     * Vérifie si le joueur est mort.
     */
    isDead() {
        return (this.getHealth() == 0);
    }

    // === Gestion des vies ===

    /**
     * Retourne le nombre de vies restantes du joueur.
     */
    getLifes() {
        return this.playerProperties.lifes;
    }

    /**
     * Diminue le nombre de vies du joueur.
     */
    decreaseLife() {
        this.playerProperties.lifes--;
    }

    // === Gestion des objets collectés ===

    /**
     * Gère la collecte d'un objet par le joueur.
     * @param {Object} item - Objet collecté.
     */
    collectItem(item) {
        if (item.getType() == "collect") {
            this.playerProperties.itemsCollected++;
        }
        if (item.getType() == "hearth") {
            this.increaseHealthPoints();
        }
    }

    // === Gestion de l'apparence ===

    /**
     * Met à jour l'apparence du joueur en fonction des propriétés fournies.
     * @param {Object} proprietes - Propriétés d'apparence.
     */
    setNewLook(proprietes) {
        // apparence dynamique :

        if (typeof (proprietes.shoot) != 'undefined') this.playerProperties.animShootName = proprietes.shoot;
        if (typeof (proprietes.move) != 'undefined') this.playerProperties.animMoveName = proprietes.move;
        if (typeof (proprietes.jump) != 'undefined') this.playerProperties.animJumpName = proprietes.jump;
        if (typeof (proprietes.stand) != 'undefined') this.playerProperties.animStandtName = proprietes.stand;
        console.log("new look : " + this.playerProperties.animShootName );
    }

    // === Gestion des kills ===

    /**
     * Retourne le nombre d'ennemis tués par le joueur.
     */
    getKills() {
        return this.playerProperties.kills;
    }

    /**
     * Ajoute un kill au compteur du joueur.
     */
    addOneKill() {
        this.playerProperties.kills++;
    }

    // === Gestion des états et du statut ===

    /**
     * Réinitialise le statut du joueur.
     */
    resetStatut() {
        this.direction = "right";
        this.isShooting = false;
        this.isMoving = true;
        this.isJumping = false;
        this.onLadder = false;
        this.justCrossingPortal = false;
        this.invincible = false;
        this.prepareToJump = false;
        this.body.setVelocityX(0);
        this.body.setAccelerationX(0);
    }

    /**
     * Définit si la destination a été atteinte.
     * @param {boolean} valueToAffect - Valeur à affecter.
     */
    setDestinationReached(valueToAffect) {
        this.playerProperties.destinationReached = valueToAffect;
    }

    // === Méthodes liées au mouvement et à l'update ===

    /**
     * Met à jour l'état du joueur (mouvement, tir, animations, etc.).
     * @param {Object} ladder_layer - Couche d'échelle pour la gestion des escaliers.
     */
    update(ladder_layer) {
        // escalade sur une echelle
        if (ladder_layer != null) {
            const playerTileUp = ladder_layer.getTileAtWorldXY(this.x, this.getTopCenter().y + 1);
            const playerTileDown = ladder_layer.getTileAtWorldXY(this.x, this.getBottomCenter().y - 1);
            if (playerTileUp || playerTileDown) {
                this.onLadder = true;
                this.body.gravity.y = 0;
            }
            else {
                this.onLadder = false;
                this.body.gravity.y = this.gravity;
            }
        }

        // Déplacement et statut
        if (this.cursors.left.isDown && this.cursors.right.isDown) {
            this.setVelocityX(0);
            this.setAccelerationX(0);
        }
        if (this.cursors.left.isDown) {
            if (this.isJumping == false) {
                if (this.direction == "right" && this.isMoving == true) {
                    this.setAccelerationX(0);
                    this.setVelocityX(0);
                }

                this.setAccelerationX(-this.getAcceleration() * this.coefDirection);
                // Limitation de la vitesse maximale
                if (this.body.velocity.x * this.coefDirection < -this.getSpeed() * this.coefDirection) {
                    this.body.setVelocityX(-this.getSpeed() * this.coefDirection);
                }
            }
            else this.body.setVelocityX(-this.getSpeed() * this.coefDirection / 2);
            if (typeof (this.scene.fond) != "undefined" && this.x > 680) {
                this.scene.fond.tilePositionX -= 0.35;
            }
            this.direction = "left";
            this.isMoving = true;
        } else if (this.cursors.right.isDown) {
            if (this.isJumping == false) {
                if (this.direction == "left" && this.isMoving == true) {

                    this.setAccelerationX(0);
                    this.setVelocityX(0);
                }
                this.setAccelerationX(this.getAcceleration() * this.coefDirection);

                // Limitation de la vitesse maximale
                if (this.body.velocity.x * this.coefDirection > this.getSpeed() * this.coefDirection) {
                    this.body.setVelocityX(this.getSpeed() * this.coefDirection);
                }

            }
            else this.body.setVelocityX(this.getSpeed() * this.coefDirection / 2);
            if (typeof (this.scene.fond) != "undefined" && this.x > 680) {
                this.scene.fond.tilePositionX += 0.35;
            }
            this.direction = "right";
            this.isMoving = true;

        } else {
            this.body.setVelocityX(0);
            this.body.setAccelerationX(0);
            this.isMoving = false;
        }
        if (this.direction == "right") {
            this.flipX = false;
        }
        else {
            this.flipX = true;
        }


        // mise a jour du statut du saut (collision avec le sol, saut sur les murs, etc.)
    	this.updateJumpStatut(); 

		// sauf sans controle de puissance :
		
		if (this.jumpKey.isDown) {
			this.jumpKey.duration += this.scene.game.loop.delta; // Increment the duration while the key is held
		}

		if (this.canJump() && Phaser.Input.Keyboard.JustDown(this.jumpKey)) 
		{
            this.isJumping=true;
			console.log(this.jumpKey.duration);
			this.jumpKey.duration = 0; // Reset the duration when the jump starts
		

			this.body.setVelocityY(-1 * this.getJumpHeight());
			this.remainingJump--;	
            console.log("statut" + this.playerProperties.canDoubleJump + " " + this.playerProperties.canTripleJump+ " " + this.playerProperties.canFly  + " " + this.playerProperties.canWallJump);
		}
/*
		// saut contrôlé
		if (this.canJump() && this.prepareToJump == true && Phaser.Input.Keyboard.JustUp(this.jumpKey)) {
			let jumpDuration = Math.min(this.jumpKey.duration, 130); // Limiter la durée à 130 ms max
			this.body.setVelocityY(-1 * this.getJumpHeight() * (jumpDuration / 130));
			this.prepareToJump = false;
			this.remainingJump--;
		}
		if (this.jumpKey.isDown) {
			this.prepareToJump = true;
			if (this.canJump() && this.jumpKey.duration > 130) {
			this.body.setVelocityY(-1 * this.getJumpHeight());
			this.prepareToJump = false;
			this.remainingJump--;
			}
		}

*/
        if (this.coefDirection == -1) {
            this.flipX = !this.flipX;
        }
        // cas particulier de la présence d'échelles 
        if (this.onLadder) {
            if (this.cursors.up.isDown) {
                this.setVelocityY(-100); // Ajustez la vitesse de montée
                this.verticalDirection = "up";
            } else if (this.cursors.down.isDown) {
                this.setVelocityY(100); // Ajustez la vitesse de descente
                this.verticalDirection = "down";
            } else {
                this.verticalDirection = "center";
                this.setVelocityY(0); // Arrêter le mouvement si aucune touche n'est enfoncée
            }
        }

        // action de tir 
        if (this.fireKey.isDown && this.canShoot() &&  this.isShooting == false ) {
            console.log(this.canShoot());
            this.isShooting = true;
            this.fire();
            // jouer l'animation de tir une seule fois
            var shootAnim = this.scene.anims.exists(this.playerProperties.animShootName)
                ? this.playerProperties.animShootName
                : this.playerProperties.animShootName_recto;
            this.shootAnimPlaying = true;
            this.anims.play(shootAnim);
            this.once('animationcomplete', () => {
                this.shootAnimPlaying = false;
            });
            this.scene.time.delayedCall(this.getCoolDownDuration(), () => {
                this.isShooting = false;
            });
        }
        // Si attaque au corps à corps : mise à jour de l'arme de poing
        if (this.closeCombat == true && this.weaponEnabled == true) {
            this.weapon.y = this.y - this.body.height / 2;
            var coefDirection = (this.flipX == false ? 1 : -1);
            this.weapon.x = this.x + coefDirection * this.scene.registry.get('spritesheetConfig')["player_shoot_right"].width / (2 * this.scene.registry.get('spritesheetConfig')["player_shoot_right"].nbFrames);
        }

        // animations du player
        if (this.shootAnimPlaying) {
            // animation de tir en cours, ne pas interrompre
        } else if (this.isJumping) {
            if (this.scene.anims.exists(this.playerProperties.animJumpName)) {
                this.anims.play(this.playerProperties.animJumpName, true);
            } else {
                this.anims.play(this.playerProperties.animJumpName_recto, true);
            }
        } else if (this.isMoving) {
            if (this.scene.anims.exists(this.playerProperties.animMoveName)) {
                this.anims.play(this.playerProperties.animMoveName, true);
            } else {
                this.anims.play(this.playerProperties.animMoveName_recto, true);
            }
        } else {
            if (this.scene.anims.exists(this.playerProperties.animStandtName)) {
                this.anims.play(this.playerProperties.animStandtName, true);
            } else {
                this.anims.play(this.playerProperties.animStandtName_recto, true);
            }
        }
    }


    canShoot() {
       return this.playerProperties.canShoot;
    }

    enableShooting() {
        this.playerProperties.canShoot = true;
    }
    // === Gestion des capacités spéciales ===

    canJump() {
        /* routine principale renvoyant true si le joueur peut sauter
        integre les conditions de saut sur les murs, de double saut, de vol
        */
        // contact avec les murs
        if (this.canFly()) return true;
        if (this.canWallJump() && (this.body.blocked.right == true || this.body.blocked.left == true)) return true; 
        if (this.remainingJump > 0)  return true;
    }

    updateJumpStatut() {
       /* met a jour les éléments permettant de calculer le statut de saut du player
       */   
               // contact du sol
        if (this.body.onFloor()) {
            this.isJumping = false;
            this.remainingJump = this.playerProperties.baseRemainingJump;
            
        }    

  
        return true;
    }

    /**
     * Vérifie si le joueur peut effectuer un double saut.
     */
    canDoubleJump() {
        return this.playerProperties.canDoubleJump;
    }

    /**
     * Active la capacité de double saut pour le joueur.
     */
    enableDoubleJump() {
		this.playerProperties.canDoubleJump = true;		
		if (this.remainingJump < 2 ) this.remainingJump = 2;
		if (this.playerProperties.baseRemainingJump < 2 ) this.playerProperties.baseRemainingJump = 2;
    }

    /**
     * Vérifie si le joueur peut effectuer un triple saut.
     */
    canTripleJump() {
        return this.playerProperties.canTripleJump;
    }

    /**
     * Active la capacité de triple saut pour le joueur.
     */
    enableTripleJump() {
		 this.playerProperties.canTripleJump = true;
		if (this.remainingJump < 3 ) this.remainingJump = 3;
		if (this.playerProperties.baseRemainingJump < 3 ) this.playerProperties.baseRemainingJump = 3;

    }

    /**
     * Vérifie si le joueur peut voler.
     */
    canFly() {
        return this.playerProperties.canFly;
    }

    /**
     * Active la capacité de voler pour le joueur.
     */
    enableFlying() {
         this.playerProperties.canFly = true;
    }

    /**
     * Vérifie si le joueur peut effectuer un saut sur les murs.
     */
    canWallJump() {
        return this.playerProperties.canWallJump;
    }

    /**
     * Active la capacité de saut sur les murs pour le joueur.
     */
    enableWallJump() {
        this.playerProperties.canWallJump = true;

    }

    /**
     * Fixe le scale absolu du joueur et adapte la hitbox.
     * @param {number} scaleValue - Valeur absolue de scale.
     */
    setAbsoluteScale(scaleValue) {
        this.setScale(scaleValue);
        this.body.setSize(this.frame.width, this.frame.height);
        this.body.setOffset(0, 0);
    }

    /**
     * Multiplie le scale actuel du joueur par un facteur et adapte la hitbox.
     * @param {number} factor - Facteur multiplicatif.
     */
    applyScaleFactor(factor) {
        this.setScale(this.scaleX * factor, this.scaleY * factor);
        this.body.setSize(this.frame.width, this.frame.height);
        this.body.setOffset(0, 0);
    }

	/**
	 * Réinitialise tous les power-ups du joueur.
	 */
	resetPowerUps() {
 		this.playerProperties.canTripleJump = false;
 		this.playerProperties.canDoubleJump = false;
        this.playerProperties.canWallJump = false;
        this.playerProperties.canFly = false;
        this.playerProperties.jumpHeight = this.scene.game.config.player_jumpHeight;
		this.playerProperties.baseRemainingJump = 1;
		console.log("[debug] Tous les power-ups ont été réinitialisés");
	}

    // === Autres méthodes ===
}

