import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SmitioScraperService } from './smitio/smitio-scraper.service';
import * as puppeteer from 'puppeteer';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger('ScraperService');

  constructor(private readonly smitioScraperService: SmitioScraperService) {}

  @Cron(CronExpression.EVERY_5_MINUTES, { name: 'fetchNewCandidates' })
  async fetchNewCandidates() {
    this.logger.verbose('Fetching new candidates...');
    const browser = await puppeteer.launch({ headless: false, slowMo: 50 });

    try {
      // Call all jobs here
      await this.smitioScraperService.scrape(browser);
      this.logger.verbose('All jobs done!');
    } catch (e) {
      this.logger.error(`Error during scraping on: ${e}`);
    } finally {
      this.logger.verbose('Closing browser!');
      await browser.close();
    }
  }
}
