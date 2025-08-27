'use strict';
const { Model } = require('sequelize');
const BcryptHelper = require('../helpers/bcrypt');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.Event, {
        foreignKey: 'created_by',
        as: 'created_events'
      });
      User.hasMany(models.MyEvent, {
        foreignKey: 'user_id',
        as: 'joined_events'
      });
      User.hasMany(models.Feedback, {
        foreignKey: 'user_id',
        as: 'feedbacks'
      });
      User.hasMany(models.AiChatLog, {
        foreignKey: 'user_id',
        as: 'chat_logs'
      });
    }
  }
  User.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Name is required'
        },
        len: {
          args: [2, 255],
          msg: 'Name must be between 2 and 255 characters'
        }
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: 'Email already exists'
      },
      validate: {
        notEmpty: {
          msg: 'Email is required'
        },
        isEmail: {
          msg: 'Invalid email format'
        }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Password is required'
        },
        len: {
          args: [6, 255],
          msg: 'Password must be at least 6 characters long'
        }
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
    modelName: 'User',
    tableName: 'users',
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await BcryptHelper.hashPassword(user.password);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await BcryptHelper.hashPassword(user.password);
        }
      }
    }
  });
  return User;
};