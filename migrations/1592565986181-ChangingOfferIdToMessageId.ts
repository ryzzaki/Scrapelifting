import {MigrationInterface, QueryRunner} from "typeorm";

export class ChangingOfferIdToMessageId1592565986181 implements MigrationInterface {
    name = 'ChangingOfferIdToMessageId1592565986181'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "candidate_entity" DROP COLUMN "sessionState"`);
        await queryRunner.query(`ALTER TABLE "candidate_entity" DROP CONSTRAINT "UQ_86eb050af3ff5a015af7cb35658"`);
        await queryRunner.query(`ALTER TABLE "candidate_entity" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "candidate_entity" ADD "messageId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "candidate_entity" ADD CONSTRAINT "UQ_4f8a47ab7feb93365bed7057c7f" UNIQUE ("messageId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "candidate_entity" DROP CONSTRAINT "UQ_4f8a47ab7feb93365bed7057c7f"`);
        await queryRunner.query(`ALTER TABLE "candidate_entity" DROP COLUMN "messageId"`);
        await queryRunner.query(`ALTER TABLE "candidate_entity" ADD "userId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "candidate_entity" ADD CONSTRAINT "UQ_86eb050af3ff5a015af7cb35658" UNIQUE ("userId")`);
        await queryRunner.query(`ALTER TABLE "candidate_entity" ADD "sessionState" character varying NOT NULL`);
    }

}
