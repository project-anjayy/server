const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create Sequelize instance
// Support both DATABASE_URL (for Supabase/production) and individual params (for development)
const sequelize = process.env.DATABASE_URL 
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      },
      pool: {
        max: 20,
        min: 5,
        acquire: 60000,
        idle: 10000
      }
    })
  : new Sequelize({
      database: process.env.DB_NAME || 'sports_events_db',
      username: process.env.DB_USER || 'postgres',
      password: (process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'postgres'),
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 20,
        min: 5,
        acquire: 60000,
        idle: 10000
      }
    });

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
  } catch (error) {
    // Silent connection test
  }
};

// Import models
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import all models
db.User = require('../../models/user')(sequelize, Sequelize);
db.Event = require('../../models/event')(sequelize, Sequelize);
db.MyEvent = require('../../models/myevent')(sequelize, Sequelize);
db.Feedback = require('../../models/feedback')(sequelize, Sequelize);
db.AiChatLog = require('../../models/aichatlog')(sequelize, Sequelize);

// Setup associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Test connection when module is loaded
testConnection();

module.exports = db;
