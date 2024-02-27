import { Session } from 'src/entities/session.entity';
import { User } from 'src/entities/user.entity';
import { DataSource, DataSourceOptions } from 'typeorm';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: 'db-trxmini-do-user-13425347-0.c.db.ondigitalocean.com',
  port: 25060,
  password: 'AVNS_x22NfBQsR8GZcj9zaBT',
  username: 'doadmin',
  entities: [User, Session],
  database: 'defaultdb',
  synchronize: true,
  logging: true,
  ssl: true,
  extra: {
    ssl: {
      rejectUnauthorized: false,
    },
  },
};

export const dataSource = new DataSource(dataSourceOptions);

dataSource
  .initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err);
  });
