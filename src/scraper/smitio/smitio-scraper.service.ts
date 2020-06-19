import { Injectable, Logger } from '@nestjs/common';
import { getConfig } from '../../config/app.config';
import { FetchResult } from '../interfaces/fetchResult.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { CandidateRepository } from '../repositories/candidate.repository';
import * as puppeteer from 'puppeteer';
import * as scraper from 'scrape-it';
import { ScraperJob } from '../interfaces/thirdparty-scraper.interface';

@Injectable()
export class SmitioScraperService implements ScraperJob {
  constructor(
    @InjectRepository(CandidateRepository)
    private readonly candidateRepository: CandidateRepository,
  ) {}

  async scrape(browser: puppeteer.Browser): Promise<void> {
    try {
      // launch a browser, fire up a new page and log into smitio
      const page = await browser.newPage();
      await this.logInToSmitio(page);
      // take a small break here
      await new Promise(resolve => setTimeout(resolve, 1500));

      await this.navigateToCandidates(page);
      const [fetchResults, messageIds] = await this.loadAllCandidateMessageIds(page);
      await this.evaluateNewCandidates(messageIds, fetchResults);

      Logger.verbose('Smitio Cycle finished!');
    } catch (e) {
      Logger.error(`Error during SMITIO scraping on: ${e}`);
      throw e;
    }
  }

  private async logInToSmitio(page: puppeteer.Page): Promise<void> {
    const credentials = getConfig().smitio;
    Logger.verbose('Typing credentials...');
    await page.goto('https://login.smitio.com/account/login', { waitUntil: 'load' });
    await page.type('#Username', credentials.username);
    await page.type('#Password', credentials.password);
    await page.click('#login_btn');
    Logger.verbose('Logged into Smitio!');
  }

  private async navigateToCandidates(page: puppeteer.Page) {
    await page.goto('https://smitio.com/en/company-/projects', { waitUntil: 'load' });
    await page.waitForSelector('#NavMenu_collapse > ul > li:nth-child(4) > a');
    await page.click('#NavMenu_collapse > ul > li:nth-child(4) > a');
    await page.reload();
  }

  private async loadAllCandidateMessageIds(page: puppeteer.Page): Promise<[FetchResult[], number[]]> {
    const candidatesHtmlContent = await page.content();
    const [scrapeResult, numberOfCandidates] = await this.scrapeHtmlContent(candidatesHtmlContent);
    Logger.verbose(`Found ${numberOfCandidates} candidates!`);
    const applicants: FetchResult[] = [];
    const messageIds: number[] = [];

    while (!(applicants.length !== 0 && applicants.length === numberOfCandidates)) {
      for (let i = 1; i <= numberOfCandidates; i++) {
        // CHAT button selector
        const selector = `#react-app > div > div > div > div.body-layout_content > section > div > div > div > div > div > div > div > article:nth-child(${i +
          1}) > div > div.catalogue_item-line--right > div > div > div:nth-child(8) > button`;
        await page.waitForSelector(selector);
        await page.click(selector);
        const offerId = page.url().split('/');

        applicants.push({
          messageId: Number.parseInt(offerId[5]),
          name: scrapeResult.articles[i - 1].name,
          position: scrapeResult.articles[i - 1].position,
          articleIndex: i + 1,
        });
        messageIds.push(Number.parseInt(offerId[5]));
        await page.goto('https://smitio.com/en/company-/candidates', { waitUntil: 'load' });
      }
    }
    Logger.verbose('Fetched all candidates!');
    return [applicants, messageIds];
  }

  private async scrapeHtmlContent(htmlContent: string): Promise<[ScrapeResult, number]> {
    const scrapeResult: ScrapeResult = await scraper.scrapeHTML(htmlContent, {
      articles: {
        listItem: '.catalogue_item.box',
        data: {
          name: '.catalogue_item-line--left .profile_content .profile_name',
          position: '.ver-nine .catalogue_item-line--right .list_col:first-child a',
        },
      },
    });
    return [scrapeResult, scrapeResult.articles.length];
  }

  private async evaluateNewCandidates(messageIds: number[], fetchResults: FetchResult[]) {
    Logger.verbose('Finding new candidates...');
    const [existingCandidates, count] = await this.candidateRepository.findCandidatesByMessageIds(messageIds);
    if (count < messageIds.length) {
      let newMessagesIds = fetchResults;
      if (count > 0) {
        newMessagesIds = fetchResults.filter(result =>
          existingCandidates.forEach(candidate => {
            return candidate.messageId !== result.messageId;
          }),
        );
      }

      Logger.verbose('Saving new candidates...');
      await this.candidateRepository.saveNewCandidates(newMessagesIds);
      // send to webhook
    }
  }
}

interface ScrapeResult {
  articles: { name: string; position: string; attachments: { urls: string[] } }[];
}
