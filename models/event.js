'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Event extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Event.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });
      Event.hasMany(models.MyEvent, {
        foreignKey: 'event_id',
        as: 'participants'
      });
      Event.hasMany(models.Feedback, {
        foreignKey: 'event_id',
        as: 'feedbacks'
      });
    }
  }
  Event.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Title is required'
        },
        len: {
          args: [3, 255],
          msg: 'Title must be between 3 and 255 characters'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.ENUM('soccer', 'basketball', 'running'),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Category is required'
        },
        isIn: {
          args: [['soccer', 'basketball', 'running']],
          msg: 'Category must be soccer, basketball, or running'
        }
      }
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Location is required'
        }
      }
    },
    time: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Event time is required'
        },
        isAfter: {
          args: new Date().toString(),
          msg: 'Event time must be in the future'
        }
      }
    },
    total_slots: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: 1,
          msg: 'Total slots must be at least 1'
        }
      }
    },
    available_slots: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: 0,
          msg: 'Available slots cannot be negative'
        }
      }
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
    ,
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE,
      field: 'created_at'
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE,
      field: 'updated_at'
    }
  }, {
    sequelize,
    modelName: 'Event',
    tableName: 'events',
    hooks: {
      beforeCreate: (event) => {
        // Set available_slots equal to total_slots when creating
        if (!event.available_slots) {
          event.available_slots = event.total_slots;
        }
      }
    },
    underscored: true
  });
  return Event;
};