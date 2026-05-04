const { Question } = require('./src/models');
const sequelize = require('./src/config/database');

const seedQuestions = [
  { role: 'Software Engineer', difficulty: 'easy', question_text: 'What is the difference between let, const, and var?' },
  { role: 'Software Engineer', difficulty: 'medium', question_text: 'Explain the concept of closures in JavaScript.' },
  { role: 'Software Engineer', difficulty: 'hard', question_text: 'How does the event loop work in Node.js?' },
  { role: 'Software Engineer', difficulty: 'easy', question_text: 'What is a higher-order function?' },
  { role: 'Software Engineer', difficulty: 'medium', question_text: 'Describe the differences between REST and GraphQL.' },
  { role: 'Software Engineer', difficulty: 'hard', question_text: 'Explain the internal working of Promise.all().' },
];

async function seed() {
  try {
    await sequelize.sync({ alter: true });
    await Question.bulkCreate(seedQuestions);
    console.log('Database seeded successfully!');
    process.exit();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
