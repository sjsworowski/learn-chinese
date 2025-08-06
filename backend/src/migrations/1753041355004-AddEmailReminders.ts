import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailReminders1753041355004 implements MigrationInterface {
    name = 'AddEmailReminders1753041355004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add email reminders enabled column to user table
        await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "emailRemindersEnabled" BOOLEAN DEFAULT true`);

        // Create email_reminders table
        await queryRunner.query(`
            CREATE TABLE "email_reminders" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "userId" uuid NOT NULL,
                "enabled" BOOLEAN DEFAULT true,
                "lastReminderSent" TIMESTAMP,
                "lastStreakCount" INTEGER DEFAULT 0,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_email_reminders" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "email_reminders" 
            ADD CONSTRAINT "FK_email_reminders_user" 
            FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "email_reminders" DROP CONSTRAINT "FK_email_reminders_user"`);
        await queryRunner.query(`DROP TABLE "email_reminders"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "emailRemindersEnabled"`);
    }
} 