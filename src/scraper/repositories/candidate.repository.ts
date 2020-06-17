import { EntityRepository, Repository } from 'typeorm';
import { CandidateEntity } from '../entities/candidate.entity';

@EntityRepository(CandidateEntity)
export class CandidateRepository extends Repository<CandidateEntity> {}
