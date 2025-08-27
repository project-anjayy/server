'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, drop the old ENUM type constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE events DROP CONSTRAINT IF EXISTS "events_category_check";
    `);
    
    // Change the column type to allow all categories
    await queryInterface.changeColumn('events', 'category', {
      type: Sequelize.ENUM(
        'Soccer', 'Basketball', 'Tennis', 'Volleyball', 'Badminton',
        'Swimming', 'Running', 'Cycling', 'Boxing', 'Martial Arts',
        'Gym/Fitness', 'Yoga', 'Dance', 'Other'
      ),
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert back to old ENUM values
    await queryInterface.changeColumn('events', 'category', {
      type: Sequelize.ENUM('soccer', 'basketball', 'running'),
      allowNull: false
    });
  }
};
