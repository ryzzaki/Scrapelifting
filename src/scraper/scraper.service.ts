import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CandidateRepository } from './repositories/candidate.repository';
import { InjectRepository } from '@nestjs/typeorm';
import * as puppeteer from 'puppeteer';
import * as scraper from 'scrape-it';
import { getConfig } from '../config/app.config';
import { FetchResult } from './fetchResult.interface';

@Injectable()
export class ScraperService {
  constructor(
    @InjectRepository(CandidateRepository)
    private readonly candidateRepository: CandidateRepository,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES, { name: 'fetchNewCandidates' })
  async fetchNewCandidates() {
    Logger.verbose('Fetching new candidates...');
    try {
      // launch a browser, fire up a new page and log into smitio
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await this.logInToSmitio(page);
      Logger.verbose('Logged into Smitio!');
      await new Promise(resolve => setTimeout(resolve, 1500));

      const [fetchResults, messageIds] = await this.loadAllCandidateMessageIds(page);
      Logger.verbose('Fetched all candidates!');

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
      await browser.close();
      Logger.verbose('Cycle finished! Browser closed!');
    } catch (e) {
      Logger.error(`Error during scraping on ${e}`);
    }
  }

  private async logInToSmitio(page: puppeteer.Page): Promise<void> {
    const credentials = getConfig().smitio;
    Logger.verbose('Typing credentials...');

    await page.goto('https://login.smitio.com/account/login', { waitUntil: 'load' });
    await page.type('#Username', credentials.username);
    await page.type('#Password', credentials.password);
    await page.click('#login_btn');
  }

  private async loadAllCandidateMessageIds(page: puppeteer.Page): Promise<[FetchResult[], number[]]> {
    await page.goto('https://smitio.com/en/company-/projects', { waitUntil: 'load' });
    await page.waitForSelector('#NavMenu_collapse > ul > li:nth-child(4) > a');
    await page.click('#NavMenu_collapse > ul > li:nth-child(4) > a');
    await page.reload();

    const candidatesHtmlContent = await page.content();
    const scrapeResult: { articles: { name: string; position: string; attachments: { urls: string[] } }[] } = await scraper.scrapeHTML(
      candidatesHtmlContent,
      {
        articles: {
          listItem: '.catalogue_item.box',
          data: {
            name: '.catalogue_item-line--left .profile_content .profile_name',
            position: '.ver-nine .catalogue_item-line--right .list_col:first-child a',
          },
        },
      },
    );

    const numberOfCandidates = scrapeResult.articles.length;

    Logger.verbose(`Found ${numberOfCandidates} candidates!`);

    const applicants: FetchResult[] = [];
    const messageIds: number[] = [];

    while (!(applicants.length !== 0 && applicants.length === numberOfCandidates)) {
      for (let i = 1; i <= numberOfCandidates; i++) {
        // CHAT button
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
    return [applicants, messageIds];
  }
}
