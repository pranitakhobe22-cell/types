module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('interview_sessions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      candidate_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      job_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM(
          'CREATED',
          'WAITING_FOR_CANDIDATE',
          'INSTRUCTIONS',
          'ROUND_STARTED',
          'QUESTION_ACTIVE',
          'ANSWER_SUBMITTED',
          'AI_EVALUATING',
          'NEXT_QUESTION',
          'ROUND_COMPLETED',
          'FINAL_EVALUATION',
          'INTERVIEW_COMPLETED',
          'DISCONNECTED',
          'PAUSED',
          'CHEATING_FLAGGED',
          'TERMINATED',
          'EXPIRED',
          'AUTO_SUBMITTED',
          'ABANDONED',
          'FAILED'
        ),
        defaultValue: 'CREATED',
        allowNull: false
      },
      current_round: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false
      },
      current_question_index: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      round_timer: {
        type: Sequelize.JSON,
        allowNull: true
      },
      question_timer: {
        type: Sequelize.JSON,
        allowNull: true
      },
      ai_memory: {
        type: Sequelize.JSON,
        allowNull: true
      },
      evaluation_summary: {
        type: Sequelize.JSON,
        allowNull: true
      },
      session_snapshot: {
        type: Sequelize.JSON,
        allowNull: true
      },
      session_schema_version: {
        type: Sequelize.STRING,
        defaultValue: 'v1',
        allowNull: false
      },
      processing_lock: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Add indexes for status, candidate_id, created_at
    await queryInterface.addIndex('interview_sessions', ['status'], { name: 'idx_sessions_status' });
    await queryInterface.addIndex('interview_sessions', ['candidate_id'], { name: 'idx_sessions_candidate_id' });
    await queryInterface.addIndex('interview_sessions', ['created_at'], { name: 'idx_sessions_created_at' });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('interview_sessions');
  }
};
