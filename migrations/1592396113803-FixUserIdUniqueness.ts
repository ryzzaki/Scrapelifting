import {MigrationInterface, QueryRunner} from "typeorm";

export class FixUserIdUniqueness1592396113803 implements MigrationInterface {
    name = 'FixUserIdUniqueness1592396113803'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "candidate_entity" ADD CONSTRAINT "UQ_86eb050af3ff5a015af7cb35658" UNIQUE ("userId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "candidate_entity" DROP CONSTRAINT "UQ_86eb050af3ff5a015af7cb35658"`);
    }

}
