/** @format */

"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("profileltmenus", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      elt_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "eltmenus",
          key: "id",
        },
      },
      profil_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "profils",
          key: "id",
        },
      },
      droit: {
        type: Sequelize.STRING(1),
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("profileltmenus");
  },
};
