import * as puppeteer from 'puppeteer';

export interface ScraperJob {
  scrape(browser: puppeteer.Browser): Promise<void>;
}
