/** @format */

"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class EltMenus extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Menus, { foreignKey: "menus_id" });
      this.hasMany(models.ProfilEltMenus, { foreignKey: "elt_id" });
    }
  }
  EltMenus.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      elt_titre: DataTypes.STRING,
      menus_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "EltMenus",
      underscored: true,
    }
  );
  return EltMenus;
};
