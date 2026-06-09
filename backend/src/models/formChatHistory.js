import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const FormChatHistory = sequelize.define("FormChatHistory", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: "users", key: "id" }
  },
  formId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING, // "user" | "ai" | "error"
    allowNull: false
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: "form_chat_history",
  timestamps: true
});
