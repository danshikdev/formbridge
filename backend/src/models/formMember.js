import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const FormMember = sequelize.define("FormMember", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  formId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: "users", key: "id" }
  },
  memberId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: "users", key: "id" }
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "viewer"
  }
}, {
  tableName: "form_members",
  timestamps: true,
  indexes: [
    { unique: true, fields: ["formId", "memberId"] }
  ]
});
