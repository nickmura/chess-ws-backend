import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import * as session from 'express-session';
import * as passport from 'passport';
import { ValidationPipe } from '@nestjs/common';
// import { Session } from './entities/session.entity';
// import { TypeormStore } from 'typeorm-store';
// import { dataSource } from './modules/dataSource';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // const sessionRepository = dataSource.getRepository(Session);

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  // console.log(process.env.SESSION_SECRET, 'process.env.SESSION_SECRET');

  // app.use(
  //   session({
  //     secret: process.env.SESSION_SECRET,
  //     resave: false,
  //     saveUninitialized: false,
  //     cookie: {
  //       domain: 'localhost',
  //       httpOnly: true,
  //       secure: false,
  //       maxAge: 1000 * 60 * 60 * 24 * 7,
  //       path: '/',
  //       sameSite: 'strict',
  //     },
  //     store: new TypeormStore({ repository: sessionRepository }),
  //   }),
  // );

  app.use(passport.initialize());
  // app.use(passport.session());

  app.useGlobalPipes(new ValidationPipe());

  await app.listen(3000);
}
bootstrap();
