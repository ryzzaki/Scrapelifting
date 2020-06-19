import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SmitioScraperService } from './smitio/smitio-scraper.service';
import * as puppeteer from 'puppeteer';

@Injectable()
export class ScraperService {
  constructor(private readonly smitioScraperService: SmitioScraperService) {}

  @Cron(CronExpression.EVERY_5_MINUTES, { name: 'fetchNewCandidates' })
  async fetchNewCandidates() {
    Logger.verbose('Fetching new candidates...');
    try {
      const browser = await puppeteer.launch({ headless: true });

      // Call all jobs here
      await this.smitioScraperService.scrape(browser);

      await browser.close();
      Logger.verbose('All jobs done! Closing browser!');
    } catch (e) {
      Logger.error(`Error during scraping on: ${e}`);
    }
  }
}
