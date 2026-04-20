export default class Item extends Phaser.Physics.Arcade.Sprite {


   constructor(scene, x, y, textureKey, proprietes) {
      super(scene, x, y, textureKey);
      this.proprietes = proprietes;

      // Ajoute l'item à la scène
      scene.add.existing(this);

      // Déterminer la clé de type (ex: "shoot", "scale", "collect"...)
      var itemType = this.proprietes.type|| this.proprietes.item_type || "collect";

      // 1) Si une animation anim_item_(type) existe, on la joue en boucle
      var animKey = "anim_item_" + itemType;
      if (scene.anims.exists(animKey)) {
         this.play({ key: animKey, repeat: -1 });
      }
      // 2) Sinon, si l'item a un attribut "texture" (ou "style"), on applique item_(valeur)
      else if (typeof this.proprietes.texture !== 'undefined') {
         this.setTexture("item_" + this.proprietes.texture);
      }
      else if (typeof this.proprietes.style !== 'undefined') {
         this.setTexture("item_" + this.proprietes.style);
      }
      // 3) Sinon, texture par défaut : item_(type)
      else {
         this.setTexture("item_" + itemType);
      }

      // Physique de l'item 
      scene.physics.world.enable(this); // Active la physique pour l'item
   }  

   getType() {
      if (typeof (this.proprietes.type) == 'undefined') {
         return "collect";
      }
      return this.proprietes.type
   }

}
