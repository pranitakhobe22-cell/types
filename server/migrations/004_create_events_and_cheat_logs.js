module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create interview_events Table
    await queryInterface.createTable('interview_events', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      event_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      event_payload: {
        type: Sequelize.JSON,
        allowNull: true
      },
      event_sequence: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      correlation_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes for interview_events
    await queryInterface.addIndex('interview_events', ['session_id'], { name: 'idx_events_session_id' });
    await queryInterface.addIndex('interview_events', ['event_type'], { name: 'idx_events_event_type' });
    await queryInterface.addIndex('interview_events', ['created_at'], { name: 'idx_events_created_at' });

    // 2. Create anti_cheat_logs Table
    await queryInterface.createTable('anti_cheat_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      violation_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      severity: {
        type: Sequelize.STRING,
        allowNull: false
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      event_sequence: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      correlation_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes for anti_cheat_logs
    await queryInterface.addIndex('anti_cheat_logs', ['session_id'], { name: 'idx_anticheat_session_id' });
    await queryInterface.addIndex('anti_cheat_logs', ['created_at'], { name: 'idx_anticheat_created_at' });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('anti_cheat_logs');
    await queryInterface.dropTable('interview_events');
  }
};
