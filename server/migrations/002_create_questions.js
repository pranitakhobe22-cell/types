module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('interview_questions', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      question_text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      difficulty: {
        type: Sequelize.STRING,
        allowNull: false
      },
      topic: {
        type: Sequelize.STRING,
        allowNull: true
      },
      question_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      question_version: {
        type: Sequelize.STRING,
        defaultValue: 'v1',
        allowNull: false
      },
      generated_by: {
        type: Sequelize.STRING,
        defaultValue: 'gemini-1.5-flash',
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

    await queryInterface.addIndex('interview_questions', ['session_id'], { name: 'idx_questions_session_id' });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('interview_questions');
  }
};
