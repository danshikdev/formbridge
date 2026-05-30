import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Request = sequelize.define("Request", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  source: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "google_forms"
  },
  formId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  formTitle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  responseId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  respondentEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  answers: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  rawPayload: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "new"
  }
}, {
  tableName: "requests",
  timestamps: true
});
