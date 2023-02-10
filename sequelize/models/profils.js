/** @format */

"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Profils extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.Users, { foreignKey: "profil_id" });
      this.hasMany(models.ProfilEltMenus, { foreignKey: "profil_id" });
    }
  }
  Profils.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      code: DataTypes.STRING,
      desctiption: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Profils",
      underscored: true,
    }
  );
  return Profils;
};
