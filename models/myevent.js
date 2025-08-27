'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MyEvent extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      MyEvent.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      MyEvent.belongsTo(models.Event, {
        foreignKey: 'event_id',
        as: 'event'
      });
    }
  }
  MyEvent.init({
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
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'joined',
      validate: {
        isIn: {
          args: [['joined', 'cancelled']],
          msg: 'Status must be joined or cancelled'
        }
      }
    },
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
    modelName: 'MyEvent',
    tableName: 'my_events',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'event_id']
      }
    ],
    underscored: true
  });
  return MyEvent;
};