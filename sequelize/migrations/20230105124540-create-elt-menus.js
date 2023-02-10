/** @format */

"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("eltmenus", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      elt_titre: {
        type: Sequelize.STRING,
      },
      menus_id: {
        type: Sequelize.INTEGER,
        references: { model: "menus", key: "id" },
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("eltmenus");
  },
};
