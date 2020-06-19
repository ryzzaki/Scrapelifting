import { EntityRepository, Repository, Any } from 'typeorm';
import { CandidateEntity } from '../entities/candidate.entity';
import { FetchResult } from '../fetchResult.interface';

@EntityRepository(CandidateEntity)
export class CandidateRepository extends Repository<CandidateEntity> {
  async saveNewCandidates(fetchedCandidates: FetchResult[]) {
    const candidates: CandidateEntity[] = [];
    for (const fetchedCandidate of fetchedCandidates) {
      const c = new CandidateEntity();
      c.messageId = fetchedCandidate.messageId;
      c.position = fetchedCandidate.position;
      candidates.push(c);
    }

    await this.save(candidates);
  }

  async findCandidatesByMessageIds(messageIds: number[]): Promise<[CandidateEntity[], number]> {
    return await this.findAndCount({ where: { messageId: Any(messageIds) } });
  }
}
