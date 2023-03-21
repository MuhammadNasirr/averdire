module.exports = {
  defaultEnv: 'local',
  local: {
    driver: 'mysql',
    multipleStatements: true,
    dialect: 'mysql',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    host: { ENV: 'DB_HOST' },
    user: { ENV: 'DB_USER' },
    password: { ENV: 'DB_PASS' },
    database: { ENV: 'DB_NAME' }
  },
  development: {
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    dialect: "mysql",
    dialectOptions: {
      connectTimeout: process.env.DB_TIMEOUT
    },
    logging: false
  },
  production: {
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    dialect: "mysql",
    dialectOptions: {
      connectTimeout: process.env.DB_TIMEOUT
    },
    logging: false
  },
  test: {
    host: "127.0.0.1",
    username: "root",
    password: null,
    database: "database_test",
    dialect: "mysql",
    dialectOptions: {
      connectTimeout: process.env.DB_TIMEOUT
    },
    logging: false
  },
};
