import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSpeedChallengeScores1753041355004 implements MigrationInterface {
    name = 'CreateSpeedChallengeScores1753041355004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "speed_challenge_scores" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "score" integer NOT NULL, "timeUsed" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_speed_challenge_scores" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "speed_challenge_scores" ADD CONSTRAINT "FK_speed_challenge_scores_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "speed_challenge_scores" DROP CONSTRAINT "FK_speed_challenge_scores_user"`);
        await queryRunner.query(`DROP TABLE "speed_challenge_scores"`);
    }
} 