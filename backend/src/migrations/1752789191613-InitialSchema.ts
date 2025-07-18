import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1752789191613 implements MigrationInterface {
    name = 'InitialSchema1752789191613'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "vocabulary" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "chinese" character varying NOT NULL, "pinyin" character varying NOT NULL, "english" character varying NOT NULL, "imageUrl" character varying NOT NULL, "difficulty" character varying NOT NULL DEFAULT 'beginner', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_65dbd74f76cee79778299a2a21b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_progress" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "vocabularyId" uuid NOT NULL, "isLearned" boolean NOT NULL DEFAULT false, "studyCount" integer NOT NULL DEFAULT '0', "lastStudied" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7b5eb2436efb0051fdf05cbe839" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "session_progress" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "currentSession" integer NOT NULL DEFAULT '0', "totalSessions" integer NOT NULL DEFAULT '0', "totalStudyTime" integer NOT NULL DEFAULT '0', "lastStudied" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cb33299c7b0bd472b67cf7d2999" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "test_session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "completedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_024c31333d823427006b7f9dd76" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "username" character varying NOT NULL, "password" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_progress" ADD CONSTRAINT "FK_b5d0e1b57bc6c761fb49e79bf89" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_progress" ADD CONSTRAINT "FK_3ce8bb633d448f7063c38e7a5b1" FOREIGN KEY ("vocabularyId") REFERENCES "vocabulary"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "session_progress" ADD CONSTRAINT "FK_30b68a66936148904c21c64c050" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "test_session" ADD CONSTRAINT "FK_b6564a7d1db0baa180d6654d113" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "test_session" DROP CONSTRAINT "FK_b6564a7d1db0baa180d6654d113"`);
        await queryRunner.query(`ALTER TABLE "session_progress" DROP CONSTRAINT "FK_30b68a66936148904c21c64c050"`);
        await queryRunner.query(`ALTER TABLE "user_progress" DROP CONSTRAINT "FK_3ce8bb633d448f7063c38e7a5b1"`);
        await queryRunner.query(`ALTER TABLE "user_progress" DROP CONSTRAINT "FK_b5d0e1b57bc6c761fb49e79bf89"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "test_session"`);
        await queryRunner.query(`DROP TABLE "session_progress"`);
        await queryRunner.query(`DROP TABLE "user_progress"`);
        await queryRunner.query(`DROP TABLE "vocabulary"`);
    }

}
