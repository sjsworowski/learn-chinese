import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * New users must be unverified until they click the email link.
 * The previous migration added emailVerified with DEFAULT true (for existing users).
 * TypeORM can omit default-valued columns on INSERT, so new rows were getting true.
 * Set the column default to false so new signups are unverified.
 */
export class SetEmailVerifiedDefaultFalse1753041355006 implements MigrationInterface {
    name = "SetEmailVerifiedDefaultFalse1753041355006";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "user" ALTER COLUMN "emailVerified" SET DEFAULT false`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "user" ALTER COLUMN "emailVerified" SET DEFAULT true`
        );
    }
}
