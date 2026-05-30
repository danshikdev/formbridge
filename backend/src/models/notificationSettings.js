import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const NotificationSettings = sequelize.define("NotificationSettings", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  formId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  channel: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "whatsapp"
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  mode: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "every_submission"
  },
  thresholdCount: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: "notification_settings",
  timestamps: true,
  indexes: [
    { unique: true, fields: ["userId", "formId", "channel"] }
  ]
});
