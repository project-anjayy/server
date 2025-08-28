'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('events', 'duration', {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: 'Durasi event dalam menit'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('events', 'duration');
  }
};
