import { Test, TestingModule } from '@nestjs/testing';
import { ScraperService } from './scraper.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CandidateEntity } from './entities/candidate.entity';

const mockRepository = () => {
  return {
    save: jest.fn(),
  };
};

describe('ScraperService', () => {
  let service: ScraperService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let repository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScraperService,
        {
          provide: getRepositoryToken(CandidateEntity),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ScraperService>(ScraperService);
    repository = module.get(getRepositoryToken(CandidateEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
