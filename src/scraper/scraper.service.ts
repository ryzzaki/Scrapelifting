import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SmitioScraperService } from './smitio/smitio-scraper.service';
import { getWebhookUrl } from '../config/app.config';
import { WebhookData } from './interfaces/webhook.interface';
import * as puppeteer from 'puppeteer';
import * as axios from 'axios';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger('ScraperService');

  constructor(private readonly smitioScraperService: SmitioScraperService) {}

  @Cron(CronExpression.EVERY_5_MINUTES, { name: 'fetchNewCandidates' })
  async fetchNewCandidates(): Promise<void> {
    this.logger.verbose('Fetching new candidates...');
    let aggregatedData: WebhookData[] = [];
    const browser = await puppeteer.launch({ headless: true, slowMo: 350, args: ['--no-sandbox'] });

    try {
      // Call all jobs here
      const smitioData = await this.smitioScraperService.scrape(browser);
      aggregatedData = [...smitioData];
      if (aggregatedData.length !== 0) {
        for (const data of aggregatedData) {
          await this.sendToWebhook(data);
        }
        this.logger.verbose(`${aggregatedData.length} candidates sent to the bot's webhook!`);
      }
      this.logger.verbose('All jobs done!');
    } catch (e) {
      this.logger.error(`Error during scraping on: ${e}`);
    } finally {
      this.logger.verbose('Closing browser!');
      await browser.close();
    }
  }

  async sendToWebhook(data: WebhookData): Promise<void> {
    const url = getWebhookUrl();
    try {
      await axios.default.post(url, data);
    } catch (e) {
      this.logger.error(e);
    }
  }
}
