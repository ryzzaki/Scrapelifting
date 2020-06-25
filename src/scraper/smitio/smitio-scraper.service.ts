import { Injectable, Logger } from '@nestjs/common';
import { getConfig, isProduction } from '../../config/app.config';
import { FetchResult } from '../interfaces/fetchResult.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { CandidateRepository } from '../repositories/candidate.repository';
import { ScraperJob } from '../interfaces/scraper-job.interface';
import * as puppeteer from 'puppeteer';
import * as scraper from 'scrape-it';
import * as axios from 'axios';

@Injectable()
export class SmitioScraperService implements ScraperJob {
  private readonly logger = new Logger('SmitioScraperService');

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
      await this.evaluateNewCandidates(page, messageIds, fetchResults);

      this.logger.verbose('Smitio Cycle finished!');
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  private async logInToSmitio(page: puppeteer.Page): Promise<void> {
    const credentials = getConfig().smitio;
    this.logger.verbose('Typing credentials...');
    await page.goto('https://login.smitio.com/account/login', { waitUntil: 'load' });
    await page.type('#Username', credentials.username);
    await page.type('#Password', credentials.password);
    await page.click('#login_btn');
    this.logger.verbose('Logged into Smitio!');
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
    this.logger.verbose(`Found ${numberOfCandidates} candidates!`);

    if (numberOfCandidates === 0) {
      return;
    }

    const applicants: FetchResult[] = [];
    const messageIds: number[] = [];

    while (!(applicants.length !== 0 && applicants.length === numberOfCandidates)) {
      for (let i = 1; i <= numberOfCandidates; i++) {
        // CHAT button selector
        // const selector = `#react-app > div > div > div > div.body-layout_content > section > div > div > div > div > div > div > div > article:nth-child(${i +
        //   1}) > div > div.catalogue_item-line--right > div > div > div:nth-child(8) > button`;
        // await page.waitForSelector(selector);
        // await page.click(selector);
        await this.clickPageNthArticleIndex(page, i + 1, 8);
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
    this.logger.verbose('Fetched all candidates!');
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

  private async evaluateNewCandidates(page: puppeteer.Page, messageIds: number[], fetchResults: FetchResult[]) {
    this.logger.verbose('Finding new candidates...');
    const [existingCandidates, count] = await this.candidateRepository.findCandidatesByMessageIds(messageIds);

    // find new candidates
    if (count < messageIds.length) {
      const newFetchCandidates = fetchResults.filter(result => {
        for (const candidate of existingCandidates) {
          if (candidate.messageId === result.messageId) {
            return false;
          }
        }
        return true;
      });

      if (newFetchCandidates.length === 0) {
        this.logger.verbose('No new candidates were found!');
        return;
      }
      this.logger.verbose('Saving new candidates...');
      await this.candidateRepository.saveNewCandidates(newFetchCandidates);
      this.logger.verbose('Done Saving new candidates...');
      for (const newId of newFetchCandidates) {
        // const selector = `#react-app > div > div > div > div.body-layout_content > section > div > div > div > div > div > div > div > article:nth-child(${newId.articleIndex}) > div > div.catalogue_item-line--right > div > div > div:nth-child(7) > button`;
        // await page.waitForSelector(selector);
        // await page.click(selector);
        await this.clickPageNthArticleIndex(page, newId.articleIndex, 7);
        const htmlContent = await page.content();
        const candidateMessageData = await scraper.scrapeHTML(htmlContent, {
          candidateChatMessages: {
            listItem: 'li.chat_center-content--line.one',
            data: {
              message: '.message .message_box',
              cvUrl: {
                selector: 'a.icon.attachment',
                attr: 'data-url',
              },
            },
          },
        });
        // parse all the info: 1. find the CV, 2. find the linkedin, 3. find the motivational letter - process of elimination
        this.logger.log(candidateMessageData);

        await page.goto('https://smitio.com/en/company-/candidates', { waitUntil: 'load' });
      }
    }
  }

  private async clickPageNthArticleIndex(page: puppeteer.Page, articleIndex: number, buttonIndex: number) {
    const selector = `#react-app > div > div > div > div.body-layout_content > section > div > div > div > div > div > div > div > article:nth-child(${articleIndex}) > div > div.catalogue_item-line--right > div > div > div:nth-child(${buttonIndex}) > button`;
    await page.waitForSelector(selector);
    await page.click(selector);
  }

  private async callWebhook() {
    const url = isProduction() ? '' : 'localhost';
    await axios.default.post(url, {});
  }
}

interface ScrapeResult {
  articles: { name: string; position: string; attachments: { urls: string[] }; chatHistory?: string }[];
}
