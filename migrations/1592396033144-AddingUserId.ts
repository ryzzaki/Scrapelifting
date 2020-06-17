import {MigrationInterface, QueryRunner} from "typeorm";

export class AddingUserId1592396033144 implements MigrationInterface {
    name = 'AddingUserId1592396033144'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "candidate_entity" ADD "userId" integer NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "candidate_entity" DROP COLUMN "userId"`);
    }

}
