import { Session } from 'src/entities/session.entity';
import { User } from 'src/entities/user.entity';
import { DataSource, DataSourceOptions } from 'typeorm';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  password: 'password',
  username: 'postgres',
  entities: [User, Session],
  database: 'trxmini.games',
  synchronize: true,
  logging: true,
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

// export { dataSource };
