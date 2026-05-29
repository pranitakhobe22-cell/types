const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventModel = sequelize.define('EventModel', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  session_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  event_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  event_payload: {
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
  tableName: 'interview_events',
  underscored: true,
  timestamps: true,
  updatedAt: false, // Event logs are append-only (no updatedAt field needed)
  indexes: [
    {
      fields: ['session_id'],
      name: 'idx_events_session_id'
    },
    {
      fields: ['event_type'],
      name: 'idx_events_event_type'
    },
    {
      fields: ['created_at'],
      name: 'idx_events_created_at'
    }
  ]
});

// Enforce event log immutability via hooks (prevent update and delete)
EventModel.beforeUpdate(() => {
  throw new Error("Audit Trail Immutable: Cannot update events");
});

EventModel.beforeDestroy(() => {
  throw new Error("Audit Trail Immutable: Cannot delete events");
});

module.exports = EventModel;
