import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
import * as passport from 'passport';
import { ValidationPipe } from '@nestjs/common';
import { Session } from './entities/session.entity';
import { TypeormStore } from 'typeorm-store';
import { dataSource } from './modules/dataSource';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const sessionRepository = dataSource.getRepository(Session); // getConnection().getRepository(Session);

  // dataSource.manager.getRepository

  app.enableCors({
    origin: 'http://localhost:3000',
    // allowedHeaders: "",
    credentials: true,
    // exposedHeaders: 'Set-Cookie',
  });

  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      // store:
      resave: false,
      saveUninitialized: false,
      cookie: {
        domain: 'localhost',
        httpOnly: true,
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        path: '/',
        sameSite: 'strict',
      },
      store: new TypeormStore({ repository: sessionRepository }),
    }),
  );

  // passport.serializeUser(function (user, done) {
  //   done(null, user);
  // });

  // passport.deserializeUser(function (user, done) {
  //   done(null, user);
  // });

  app.use(passport.initialize());
  app.use(passport.session());

  app.useGlobalPipes(new ValidationPipe());

  await app.listen(5000);
}
bootstrap();
