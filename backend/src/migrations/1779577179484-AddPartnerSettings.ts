import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPartnerSettings1779577179484 implements MigrationInterface {
    name = 'AddPartnerSettings1779577179484'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "speed_challenge_scores" DROP CONSTRAINT "FK_speed_challenge_scores_user"`);
        await queryRunner.query(`ALTER TABLE "email_reminders" DROP CONSTRAINT "FK_email_reminders_user"`);
        await queryRunner.query(`CREATE TABLE "partner_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "email" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_25ec258b870291f743c1ff00248" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "emailRemindersEnabled" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "email_reminders" ALTER COLUMN "enabled" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "email_reminders" ALTER COLUMN "lastStreakCount" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "speed_challenge_scores" ADD CONSTRAINT "FK_0ff26981b80ac2640483ce4c75b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "email_reminders" ADD CONSTRAINT "FK_67f96dd56fda68e13b8b1a61f40" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "partner_settings" ADD CONSTRAINT "FK_d4f0c6eeb2b471dd2585a63ce24" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "partner_settings" DROP CONSTRAINT "FK_d4f0c6eeb2b471dd2585a63ce24"`);
        await queryRunner.query(`ALTER TABLE "email_reminders" DROP CONSTRAINT "FK_67f96dd56fda68e13b8b1a61f40"`);
        await queryRunner.query(`ALTER TABLE "speed_challenge_scores" DROP CONSTRAINT "FK_0ff26981b80ac2640483ce4c75b"`);
        await queryRunner.query(`ALTER TABLE "email_reminders" ALTER COLUMN "lastStreakCount" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "email_reminders" ALTER COLUMN "enabled" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "emailRemindersEnabled" DROP NOT NULL`);
        await queryRunner.query(`DROP TABLE "partner_settings"`);
        await queryRunner.query(`ALTER TABLE "email_reminders" ADD CONSTRAINT "FK_email_reminders_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "speed_challenge_scores" ADD CONSTRAINT "FK_speed_challenge_scores_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
