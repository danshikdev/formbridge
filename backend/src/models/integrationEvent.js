import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const IntegrationEvent = sequelize.define("IntegrationEvent", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  integrationId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  requestId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  responseId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "ok"
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  attempt: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  payload: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: "integration_events",
  timestamps: true
});
