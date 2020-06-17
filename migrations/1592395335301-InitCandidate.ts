import {MigrationInterface, QueryRunner} from "typeorm";

export class InitCandidate1592395335301 implements MigrationInterface {
    name = 'InitCandidate1592395335301'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "candidate_entity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "position" character varying NOT NULL, "sessionState" character varying NOT NULL, CONSTRAINT "PK_166da83c5c6e6edd639e8b896e2" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "candidate_entity"`);
    }

}
