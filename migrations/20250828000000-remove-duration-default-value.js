'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove default value from duration column
    await queryInterface.changeColumn('events', 'duration', {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: 'Durasi event dalam menit'
    });
  },
  async down(queryInterface, Sequelize) {
    // Add back default value if needed to rollback
    await queryInterface.changeColumn('events', 'duration', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 90,
      comment: 'Durasi event dalam menit'
    });
  }
};
