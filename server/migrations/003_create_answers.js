module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('interview_answers', {
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
      question_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      answer_text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      raw_transcript: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      confidence_score: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      transcript_confidence: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      low_confidence_segments: {
        type: Sequelize.JSON,
        allowNull: true
      },
      detected_pauses: {
        type: Sequelize.JSON,
        allowNull: true
      },
      submitted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      evaluation_result: {
        type: Sequelize.JSON,
        allowNull: true
      },
      raw_llm_response: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      parsed_output: {
        type: Sequelize.JSON,
        allowNull: true
      },
      prompt_used: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      token_usage: {
        type: Sequelize.JSON,
        allowNull: true
      },
      evaluation_confidence: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      evaluation_version: {
        type: Sequelize.STRING,
        allowNull: true
      },
      prompt_version: {
        type: Sequelize.STRING,
        allowNull: true
      },
      input_tokens: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      output_tokens: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      estimated_cost: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      recruiter_override: {
        type: Sequelize.JSON,
        allowNull: true
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

    // Indexes
    await queryInterface.addIndex('interview_answers', ['session_id'], { name: 'idx_answers_session_id' });
    await queryInterface.addIndex('interview_answers', ['question_id'], { name: 'idx_answers_question_id' });
    await queryInterface.addIndex('interview_answers', ['submitted_at'], { name: 'idx_answers_submitted_at' });
    await queryInterface.addIndex('interview_answers', ['session_id', 'question_id'], {
      unique: true,
      name: 'unique_session_question_answer'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('interview_answers');
  }
};
