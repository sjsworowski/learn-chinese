import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserActivity1753041355003 implements MigrationInterface {
    name = 'AddUserActivity1753041355003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_activity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "type" character varying NOT NULL, "duration" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_daec6d19443689bda7d7785dff5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_activity" ADD CONSTRAINT "FK_c8d8d7cfc6e3433e725339c952b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_activity" DROP CONSTRAINT "FK_c8d8d7cfc6e3433e725339c952b"`);
        await queryRunner.query(`DROP TABLE "user_activity"`);
    }

}
