import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateRepository } from './repositories/candidate.repository';
import { SmitioScraperService } from './smitio/smitio-scraper.service';

@Module({
  imports: [ScheduleModule.forRoot(), TypeOrmModule.forFeature([CandidateRepository])],
  providers: [ScraperService, SmitioScraperService],
})
export class ScraperModule {}
