const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AntiCheatLogModel = sequelize.define('AntiCheatLogModel', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  session_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  violation_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  severity: {
    type: DataTypes.STRING, // e.g. LOW, MEDIUM, HIGH, CRITICAL
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  },
  event_sequence: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  correlation_id: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'anti_cheat_logs',
  underscored: true,
  timestamps: true,
  updatedAt: false, // Cheat logs are append-only
  indexes: [
    {
      fields: ['session_id'],
      name: 'idx_anticheat_session_id'
    },
    {
      fields: ['created_at'],
      name: 'idx_anticheat_created_at'
    }
  ]
});

// Enforce audit log immutability via hooks (prevent update and delete)
AntiCheatLogModel.beforeUpdate(() => {
  throw new Error("Audit Trail Immutable: Cannot update anti-cheat logs");
});

AntiCheatLogModel.beforeDestroy(() => {
  throw new Error("Audit Trail Immutable: Cannot delete anti-cheat logs");
});

module.exports = AntiCheatLogModel;
