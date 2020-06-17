import { Module } from '@nestjs/common';
import { ScraperModule } from './scraper/scraper.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from './config/app.config';

@Module({
  imports: [ScraperModule, TypeOrmModule.forRoot(getTypeOrmConfig())],
})
export class AppModule {}
