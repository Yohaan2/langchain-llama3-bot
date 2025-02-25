import { DataTypes, Model } from "sequelize";
import sequelize from "../config/databse"; // Asegúrate de importar la configuración de Sequelize

class Conversation extends Model {
  public id!: number;
  public userId!: string;
  public sessionId!: string;
  public role!: "usuario" | "asistente";
  public message!: string;
  public timestamp!: Date;
}

Conversation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sessionId: {
      type: DataTypes.STRING, // YYYYMMDD para agrupar por fecha
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("usuario", "asistente"),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    createdAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
      }
  },
  {
    sequelize,
    tableName: "conversations",
    modelName: "conversations",
    timestamps: true
  }
);

export default Conversation;