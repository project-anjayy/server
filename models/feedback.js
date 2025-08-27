'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Feedback extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Feedback.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      Feedback.belongsTo(models.Event, {
        foreignKey: 'event_id',
        as: 'event'
      });
    }
  }
  Feedback.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'events',
        key: 'id'
      }
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: 1,
          msg: 'Rating must be at least 1'
        },
        max: {
          args: 5,
          msg: 'Rating must be at most 5'
        }
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
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
    modelName: 'Feedback',
    tableName: 'feedbacks',
    indexes: [
      {
        fields: ['user_id', 'event_id']
      }
    ]
    ,
    underscored: true
  });
  return Feedback;
};