import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const AIChatJob = sequelize.define("AIChatJob", {
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
  // "pending" | "done" | "error"
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "pending"
  },
  reply: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: "ai_chat_jobs",
  timestamps: true
});
