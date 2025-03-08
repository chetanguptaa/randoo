import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function getApplicationInstance(): Promise<INestApplication<any>> {
  const app = await NestFactory.create(AppModule);
  const configService: ConfigService = app.get(ConfigService);
  if (configService.get('NODE_ENV') !== 'production') {
    app.enableCors({
      origin: ['http://localhost:3000'],
      credentials: true,
    });
  } else {
    app.enableCors({
      origin: '',
      credentials: true,
    });
  }
  app.setGlobalPrefix('/api');
  app.use(cookieParser());
  app.use(helmet());
  return app;
}

async function bootstrap() {
  const app = await getApplicationInstance();
  const configService: ConfigService = app.get(ConfigService);
  const port = configService.get('PORT');
  await app.listen(port, () => {
    console.log(`listening on port ${port}`);
  });
}
bootstrap();
