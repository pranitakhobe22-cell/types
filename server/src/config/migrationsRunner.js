const fs = require('fs');
const path = require('path');
const { QueryTypes } = require('sequelize');

async function runMigrations(sequelize) {
  console.log("⏳ Checking database migrations...");
  
  // Create meta table if it doesn't exist to track run migrations
  // Use a query dialect check or generic SQL
  const isPostgres = sequelize.getDialect() === 'postgres';
  
  if (isPostgres) {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS sequelize_meta (
        name VARCHAR(255) PRIMARY KEY
      );
    `);
  } else {
    // SQLite syntax
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS sequelize_meta (
        name TEXT PRIMARY KEY
      );
    `);
  }

  const executedMigrations = (await sequelize.query(
    'SELECT name FROM sequelize_meta',
    { type: QueryTypes.SELECT }
  )).map(row => row.name);

  const migrationsDir = path.join(__dirname, '../../migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.log("⚠️ Migrations directory not found.");
    return;
  }

  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.js'))
    .sort();

  for (const file of migrationFiles) {
    if (!executedMigrations.includes(file)) {
      console.log(`🚀 Running migration: ${file}`);
      const migration = require(path.join(migrationsDir, file));
      
      const transaction = await sequelize.transaction();
      try {
        await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
        await sequelize.query(
          'INSERT INTO sequelize_meta (name) VALUES (:name)',
          {
            replacements: { name: file },
            type: QueryTypes.INSERT,
            transaction
          }
        );
        await transaction.commit();
        console.log(`✅ Completed migration: ${file}`);
      } catch (err) {
        await transaction.rollback();
        console.error(`❌ Migration failed: ${file}. Error:`, err.message);
        throw err;
      }
    }
  }
  console.log("✅ All migrations are up to date.");
}

module.exports = { runMigrations };
