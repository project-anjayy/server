'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('events', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      category: {
        type: Sequelize.ENUM('soccer', 'basketball', 'running'),
        allowNull: false
      },
      location: {
        type: Sequelize.STRING,
        allowNull: false
      },
      time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      total_slots: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      available_slots: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'created_at'
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'updated_at'
      }
    });
    
    // Add indexes
    await queryInterface.addIndex('events', ['category']);
    await queryInterface.addIndex('events', ['time']);
    await queryInterface.addIndex('events', ['location']);
    await queryInterface.addIndex('events', ['created_by']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('events');
  }
};