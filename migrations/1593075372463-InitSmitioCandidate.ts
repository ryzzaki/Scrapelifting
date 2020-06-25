import {MigrationInterface, QueryRunner} from "typeorm";

export class InitSmitioCandidate1593075372463 implements MigrationInterface {
    name = 'InitSmitioCandidate1593075372463'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "smitio_candidate_entity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "messageId" integer NOT NULL, "position" character varying NOT NULL, CONSTRAINT "UQ_a76cee268732c015ad7584c573b" UNIQUE ("messageId"), CONSTRAINT "PK_70ccc629a144c3eef619e7d9363" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "smitio_candidate_entity"`);
    }

}
