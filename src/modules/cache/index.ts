import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';

export const RedisOptions: CacheModuleAsyncOptions = {
  isGlobal: true,
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => {
    // const redisOptions = {
    //   username: configService.get<string>('REDIS_USERNAME'),
    //   password: configService.get<string>('REDIS_PASSWORD'),
    //   socket: {
    //     host: configService.get<string>('REDIS_HOST'),
    //     port: parseInt(configService.get<string>('REDIS_PORT')!),
    //     tls: true,
    //   },
    // };

    // console.log({ redisOptions });

    // const store = await redisStore(redisOptions);
    const store = await redisStore({
      username: configService.get<string>('REDIS_USERNAME'),
      password: configService.get<string>('REDIS_PASSWORD'),
      socket: {
        host: configService.get<string>('REDIS_HOST'),
        port: parseInt(configService.get<string>('REDIS_PORT')!),
        tls: Boolean(configService.get<string>('REDIS_TLS')),
        // keepAlive: 1000 * 60 * 60,
        // sessionTimeout: 0,
        // connectTimeout: 1000 * 60 * 60 * 1,
      },
    });

    return {
      store: () => store,
    };
  },
  inject: [ConfigService],
};
