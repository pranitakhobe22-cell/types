const { Sequelize } = require('sequelize');
require('dotenv').config();

const isPostgres = !!process.env.DATABASE_URL;

const sequelize = isPostgres 
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
    })
  : new Sequelize({
      dialect: 'sqlite',
      storage: './database.sqlite',
      logging: false
    });

if (!isPostgres) {
  console.log("⚠️ No DATABASE_URL found. Using local SQLite (database.sqlite).");
}

module.exports = sequelize;
