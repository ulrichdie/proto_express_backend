/** @format */

"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ProfilEltMenus extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Profils, { foreignKey: "profil_id" });
      this.belongsTo(models.EltMenus, { foreignKey: "elt_id" });
    }
  }
  ProfilEltMenus.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      elt_id: DataTypes.INTEGER,
      profil_id: DataTypes.INTEGER,
      droit: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "ProfilEltMenus",
      underscored: true,
    }
  );
  return ProfilEltMenus;
};
