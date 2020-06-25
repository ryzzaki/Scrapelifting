import { WebhookData } from './webhook.interface';
import * as puppeteer from 'puppeteer';

export interface ScraperJob {
  scrape(browser: puppeteer.Browser): Promise<WebhookData[] | undefined>;
}
