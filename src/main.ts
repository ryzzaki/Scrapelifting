import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getConfig } from './config/app.config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = getConfig().port || 3000;
  await app.listen(port);
  Logger.verbose(`Server listening on port ${port}`);
}
bootstrap();
