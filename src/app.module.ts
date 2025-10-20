import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { LoggerMiddleware } from './logger/logger.middleware';
import { MpesaExpressModule } from './mpesa-express/mpesa-express.module';
import { ConfigModule, ConfigService } from '@nestjs/config'; 
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { AppController } from './app.controller';


@Module({
    imports: [MpesaExpressModule,
        ConfigModule.forRoot({ isGlobal: true }),
        RedisModule.forRootAsync({
            useFactory: (configService: ConfigService) => {
                const redisUrl = configService.get('REDIS_URL') || 'redis://127.0.0.1:6379';
                return {
                    config: {
                        url: redisUrl,
                        retryDelayOnFailover: 100,
                        enableReadyCheck: false,
                        maxRetriesPerRequest: null,
                    },
                };
            },
            inject: [ConfigService],
        }),
    ],
    controllers: [AppController],
    providers: [],
})
export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('*');
    }
}
