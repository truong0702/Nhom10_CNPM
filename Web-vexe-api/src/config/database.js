import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: resolve(__dirname, '../../.env') });

const dbName = process.env.DB_NAME || 'vexere_db';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'postgres';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || 5432;
const dbDialect = process.env.DB_DIALECT || 'postgres';
const shouldLog = process.env.NODE_ENV === 'development' ? console.log : false;

const createSequelize = (databaseName) =>
  new Sequelize(databaseName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: dbDialect,
    logging: shouldLog,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });

const ensureDatabase = async () => {
  if (dbDialect !== 'postgres' || dbName === 'postgres') return;

  const adminSequelize = createSequelize('postgres');
  const safeDbName = dbName.replace(/"/g, '""');

  try {
    await adminSequelize.authenticate();
    await adminSequelize.query(`CREATE DATABASE "${safeDbName}"`);
    console.log(`? Database "${dbName}" created`);
  } catch (error) {
    const code = error?.parent?.code || error?.original?.code;
    if (code !== '42P04') {
      throw error;
    }
  } finally {
    await adminSequelize.close();
  }
};

await ensureDatabase();

const sequelize = createSequelize(dbName);

export default sequelize;
