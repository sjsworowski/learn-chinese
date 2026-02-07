import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailVerified1753041355005 implements MigrationInterface {
    name = "AddEmailVerified1753041355005";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "user" ADD COLUMN "emailVerified" boolean NOT NULL DEFAULT true`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "emailVerified"`);
    }
}
