'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Step 1: Convert column to VARCHAR temporarily
    await queryInterface.changeColumn('events', 'category', {
      type: Sequelize.STRING,
      allowNull: false
    });

    // Step 2: Update existing data to proper case
    await queryInterface.sequelize.query(`
      UPDATE events SET category = 'Soccer' WHERE category = 'soccer';
      UPDATE events SET category = 'Basketball' WHERE category = 'basketball'; 
      UPDATE events SET category = 'Running' WHERE category = 'running';
    `);

    // Step 3: Drop the old enum type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_events_category;
    `);

    // Step 4: Create new enum type
    await queryInterface.sequelize.query(`
      CREATE TYPE enum_events_category AS ENUM (
        'Soccer', 'Basketball', 'Tennis', 'Volleyball', 'Badminton',
        'Swimming', 'Running', 'Cycling', 'Boxing', 'Martial Arts',
        'Gym/Fitness', 'Yoga', 'Dance', 'Other'
      );
    `);

    // Step 5: Convert column back to the new enum
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
    // Convert to VARCHAR
    await queryInterface.changeColumn('events', 'category', {
      type: Sequelize.STRING,
      allowNull: false
    });

    // Update data back to lowercase
    await queryInterface.sequelize.query(`
      UPDATE events SET category = 'soccer' WHERE category = 'Soccer';
      UPDATE events SET category = 'basketball' WHERE category = 'Basketball';
      UPDATE events SET category = 'running' WHERE category = 'Running';
    `);

    // Drop new enum
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_events_category;
    `);

    // Create old enum
    await queryInterface.sequelize.query(`
      CREATE TYPE enum_events_category AS ENUM ('soccer', 'basketball', 'running');
    `);

    // Convert back to old enum
    await queryInterface.changeColumn('events', 'category', {
      type: Sequelize.ENUM('soccer', 'basketball', 'running'),
      allowNull: false
    });
  }
};
