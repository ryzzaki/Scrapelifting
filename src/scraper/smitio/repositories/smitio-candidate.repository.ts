import { EntityRepository, Repository, Any } from 'typeorm';
import { SmitioCandidateEntity } from '../entities/smitio-candidate.entity';
import { EphemeralCandidateData } from '../interfaces/smitio-result.interface';

@EntityRepository(SmitioCandidateEntity)
export class SmitioCandidateRepository extends Repository<SmitioCandidateEntity> {
  async saveNewCandidates(fetchedCandidates: EphemeralCandidateData[]) {
    const candidates: SmitioCandidateEntity[] = [];
    for (const fetchedCandidate of fetchedCandidates) {
      const c = new SmitioCandidateEntity();
      c.messageId = fetchedCandidate.messageId;
      c.position = fetchedCandidate.position;
      candidates.push(c);
    }

    await this.save(candidates);
  }

  async findCandidatesByMessageIds(messageIds: number[]): Promise<[SmitioCandidateEntity[], number]> {
    return await this.findAndCount({ where: { messageId: Any(messageIds) } });
  }
}
