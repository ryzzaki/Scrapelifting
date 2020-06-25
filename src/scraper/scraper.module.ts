import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmitioCandidateRepository } from './smitio/repositories/smitio-candidate.repository';
import { SmitioScraperService } from './smitio/smitio-scraper.service';

@Module({
  imports: [ScheduleModule.forRoot(), TypeOrmModule.forFeature([SmitioCandidateRepository])],
  providers: [ScraperService, SmitioScraperService],
})
export class ScraperModule {}
