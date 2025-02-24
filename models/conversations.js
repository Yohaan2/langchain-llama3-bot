'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class converations extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  converations.init({
    userId: DataTypes.STRING,
    sessionId: DataTypes.STRING,
    role: DataTypes.ENUM("usuario", "asistente"),
    message: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'converations',
    tableName: 'converations',
  });
  return converations;
};