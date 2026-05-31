import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const FormFeedback = sequelize.define("FormFeedback", {
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
  scenario: {
    type: DataTypes.STRING,
    allowNull: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "new"
  }
}, {
  tableName: "form_feedback",
  timestamps: true
});
