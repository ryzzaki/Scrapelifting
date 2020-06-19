import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

interface AppConfig {
  port: number;
  target: string;
  typeOrm: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  smitio: {
    username: string;
    password: string;
  };
}

export const getConfig = (): AppConfig => {
  return {
    port: Number.parseInt(process.env.PORT),
    target: process.env.TARGET,
    typeOrm: {
      host: process.env.DB_HOST,
      port: Number.parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    smitio: {
      username: process.env.SMITIO_USERNAME,
      password: process.env.SMITIO_PASSWORD,
    },
  };
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

export const getTypeOrmConfig = (): TypeOrmModuleOptions => {
  const ormConfig = getConfig().typeOrm;

  return {
    type: 'postgres',
    host: ormConfig.host,
    port: ormConfig.port,
    username: ormConfig.username,
    password: ormConfig.password,
    database: ormConfig.database,
    ssl: isProduction(),
    synchronize: false,
    entities: [join(__dirname, '/../**/*.entity.{js,ts}')],
    migrations: [join(__dirname, '..', '..', 'migrations', '*.{js,ts}')],
    cli: {
      migrationsDir: 'migrations',
    },
    migrationsTransactionMode: 'all',
  };
};
