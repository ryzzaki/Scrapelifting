import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CandidateRepository } from './repositories/candidate.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { CandidateEntity } from './entities/candidate.entity';

@Injectable()
export class ScraperService {
  constructor(
    @InjectRepository(CandidateEntity)
    private readonly candidateRepository: CandidateRepository,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES, { name: 'fetchNewCandidates' })
  async fetchNewCandidates() {
    // cron logic
  }
}
