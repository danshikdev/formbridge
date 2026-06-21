import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const FormIntegration = sequelize.define("FormIntegration", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: "users", key: "id" }
  },
  googleAccountId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: "google_accounts", key: "id" }
  },
  formUrl: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  formId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  formTitle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sheetId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sheetUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  scriptProjectId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  triggerId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  webhookUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  webhookSecret: {
    type: DataTypes.STRING,
    allowNull: true
  },
  setupMode: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "manual"
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "draft"
  },
  healthStatus: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "unknown"
  },
  lastEventAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastErrorAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastErrorReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  lastVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastTestAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastTestResult: {
    type: DataTypes.STRING,
    allowNull: true
  },
  setupChecklist: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  formSchema: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  syncEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  syncStatus: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "idle"
  },
  lastSyncedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastSyncError: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  scenario: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "universal"
  },
  scenarioConfiguredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  customStatuses: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: null
  }
}, {
  tableName: "form_integrations",
  timestamps: true
});
