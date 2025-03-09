import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { GamesModule } from './games/games.module';
import configuration from './config/configuration';
import { AuthMiddleware } from './guard/auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    AuthModule,
    GamesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude({ path: 'games/:gameId/join-game', method: RequestMethod.POST })
      .forRoutes({ path: 'games/*', method: RequestMethod.ALL });
  }
}
