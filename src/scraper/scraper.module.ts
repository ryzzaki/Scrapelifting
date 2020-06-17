import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateRepository } from './repositories/candidate.repository';

@Module({
  imports: [ScheduleModule.forRoot(), TypeOrmModule.forFeature([CandidateRepository])],
  providers: [ScraperService],
})
export class ScraperModule {}
