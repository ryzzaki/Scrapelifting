import { Injectable, Logger } from '@nestjs/common';
import { getConfig } from '../../config/app.config';
import { EphemeralCandidateData, CandidateMessageHistory, GenericCandidate } from './interfaces/smitio-result.interface';
import { WebhookData } from '../interfaces/webhook.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { SmitioCandidateRepository } from './repositories/smitio-candidate.repository';
import { ScraperJob } from '../interfaces/scraper-job.interface';
import * as puppeteer from 'puppeteer';
import * as scraper from 'scrape-it';

@Injectable()
export class SmitioScraperService implements ScraperJob {
  private readonly logger = new Logger('SmitioScraperService');

  constructor(
    @InjectRepository(SmitioCandidateRepository)
    private readonly candidateRepository: SmitioCandidateRepository
  ) {}

  async scrape(browser: puppeteer.Browser): Promise<WebhookData[]> {
    try {
      // launch a browser, fire up a new page and log into smitio
      const page = await browser.newPage();
      await this.logInToSmitio(page);
      // let's take a small break here
      await new Promise(resolve => setTimeout(resolve, 1500));
      await this.navigateToCandidates(page);
      const [fetchResults, messageIds] = await this.loadAllCandidateMessageIds(page);
      const allNewCandidateData = await this.evaluateNewCandidates(page, messageIds, fetchResults);
      this.logger.verbose('Smitio Cycle finished!');
      return this.parseCollectedCandidateData(allNewCandidateData);
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

  private async navigateToCandidates(page: puppeteer.Page): Promise<void> {
    await page.goto('https://smitio.com/en/company-/projects', { waitUntil: 'load' });
    await page.waitForSelector('#NavMenu_collapse > ul > li:nth-child(4) > a');
    await page.click('#NavMenu_collapse > ul > li:nth-child(4) > a');
    await page.reload();
  }

  private async loadAllCandidateMessageIds(page: puppeteer.Page): Promise<[EphemeralCandidateData[], number[]]> {
    const candidatesHtmlContent = await page.content();
    const [scrapeResult, numberOfCandidates] = await this.findAllCandidateArticles(candidatesHtmlContent);
    this.logger.verbose(`Found ${numberOfCandidates} candidates!`);

    if (numberOfCandidates === 0) {
      return [[], []];
    }

    const applicants: EphemeralCandidateData[] = [];
    const messageIds: number[] = [];

    while (!(applicants.length !== 0 && applicants.length === numberOfCandidates)) {
      for (let i = 1; i <= numberOfCandidates; i++) {
        // CHAT button selector
        await this.clickPageNthArticleIndex(page, i + 1, 8);
        const chatUrl = page.url().split('/');

        applicants.push({
          messageId: Number.parseInt(chatUrl[5]),
          offerId: Number.parseInt(chatUrl[7]),
          urlDetail: chatUrl.join('/'),
          name: scrapeResult[i - 1].name,
          position: scrapeResult[i - 1].position,
          articleIndex: i + 1,
        });
        messageIds.push(Number.parseInt(chatUrl[5]));
        await page.goto('https://smitio.com/en/company-/candidates', { waitUntil: 'load' });
      }
    }
    this.logger.verbose('Fetched all candidates!');
    return [applicants, messageIds];
  }

  private async findAllCandidateArticles(htmlContent: string): Promise<[GenericCandidate[], number]> {
    const scrapeResult: { articles: GenericCandidate[] } = await scraper.scrapeHTML(htmlContent, {
      articles: {
        listItem: '.catalogue_item.box',
        data: {
          name: '.catalogue_item-line--left .profile_content .profile_name',
          position: '.ver-nine .catalogue_item-line--right .list_col:first-child a',
        },
      },
    });
    return [scrapeResult.articles, scrapeResult.articles.length];
  }

  private async evaluateNewCandidates(
    page: puppeteer.Page,
    messageIds: number[],
    fetchResults: EphemeralCandidateData[]
  ): Promise<EphemeralCandidateData[]> {
    if (messageIds.length === 0 || fetchResults.length === 0) {
      return [];
    }

    this.logger.verbose('Finding new candidates...');
    const [existingCandidates, count] = await this.candidateRepository.findCandidatesByMessageIds(messageIds);

    let newFetchCandidates: EphemeralCandidateData[] = [];

    // find new candidates
    if (count < messageIds.length) {
      newFetchCandidates = fetchResults.filter(result => {
        for (const candidate of existingCandidates) {
          if (candidate.messageId === result.messageId) {
            return false;
          }
        }
        return true;
      });

      this.logger.verbose('Saving new candidates...');
      await this.candidateRepository.saveNewCandidates(newFetchCandidates);
      this.logger.verbose('Done Saving new candidates...');
      for (const newId of newFetchCandidates) {
        await this.clickPageNthArticleIndex(page, newId.articleIndex, 7);
        const htmlContent = await page.content();
        const scrapeResults: { candidateChatHistoryMessages: CandidateMessageHistory[] } = await scraper.scrapeHTML(htmlContent, {
          candidateChatHistoryMessages: {
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
        newId.candidateMessageData = scrapeResults.candidateChatHistoryMessages;
        await page.goto('https://smitio.com/en/company-/candidates', { waitUntil: 'load' });
      }
    }
    return newFetchCandidates;
  }

  private async clickPageNthArticleIndex(page: puppeteer.Page, articleIndex: number, buttonIndex: number) {
    const selector = `#react-app > div > div > div > div.body-layout_content > section > div > div > div > div > div > div > div > article:nth-child(${articleIndex}) > div > div.catalogue_item-line--right > div > div > div:nth-child(${buttonIndex}) > button`;
    await page.waitForSelector(selector);
    await page.click(selector);
  }

  private async parseCollectedCandidateData(allCandidateData: EphemeralCandidateData[]): Promise<WebhookData[]> {
    if (allCandidateData?.length === 0) {
      return [];
    }

    const allWebhookData: WebhookData[] = [];
    for (const candidate of allCandidateData) {
      const cvFiles = [];
      let linkedin = '';
      let motivationalLetter = 'No motivational letter was included :(';
      if (candidate.candidateMessageData && candidate.candidateMessageData?.length !== 0) {
        // find all the information by the process of elimination
        candidate.candidateMessageData.forEach((messageBlob, index) => {
          if (!messageBlob.message) {
            return;
          }

          if (
            (messageBlob.message.toLowerCase().includes('.pdf') || messageBlob.message.toLowerCase().includes('.docx')) &&
            messageBlob.cvUrl
          ) {
            cvFiles.push(messageBlob.cvUrl);
            candidate.candidateMessageData.splice(index, 1);
            return;
          }

          if (messageBlob.message.toLowerCase().includes('https://www.linkedin.com/')) {
            linkedin = messageBlob.message;
            candidate.candidateMessageData.splice(index, 1);
            return;
          }
        });
        if (candidate.candidateMessageData?.length !== 0) {
          motivationalLetter = candidate.candidateMessageData?.shift().message;
        }
      }
      const parsedCandidate: WebhookData = {
        date: new Date(),
        candidateID: candidate.messageId,
        offerID: candidate.offerId,
        name: candidate.name,
        position: candidate.position,
        why: motivationalLetter,
        phone: '+420123456789',
        email: 'email@email.cz',
        details: candidate.urlDetail,
        linkedin,
        internalPositionName: candidate.position,
        files: cvFiles,
        // eslint-disable-next-line @typescript-eslint/camelcase
        gdpr_accepted: true,
        // source: 'SMITIO',
      };
      allWebhookData.push(parsedCandidate);
    }
    return allWebhookData;
  }
}
