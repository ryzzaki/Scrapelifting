import { Test, TestingModule } from '@nestjs/testing';
import { ScraperService } from './scraper.service';
import { SmitioScraperService } from './smitio/smitio-scraper.service';

const mockSmitioScraper = () => {
  return {
    scrape: jest.fn(),
  };
};

describe('ScraperService', () => {
  let service: ScraperService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let smitioScraperService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScraperService,
        {
          provide: SmitioScraperService,
          useFactory: mockSmitioScraper,
        },
      ],
    }).compile();
    service = module.get<ScraperService>(ScraperService);
    smitioScraperService = module.get<SmitioScraperService>(SmitioScraperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
