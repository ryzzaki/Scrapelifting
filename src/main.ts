/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable func-style */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getConfig } from './config/app.config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('bootstrap');
  const app = await NestFactory.create(AppModule);
  const port = getConfig().port || 3000;
  await app.listen(port);
  logger.verbose(`Server listening on port ${port}`);
}
bootstrap();
