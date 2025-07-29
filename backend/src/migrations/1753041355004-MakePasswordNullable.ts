import { MigrationInterface, QueryRunner } from "typeorm"

export class MakePasswordNullable1753041355004 implements MigrationInterface {
    name = 'MakePasswordNullable1753041355004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "password" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "password" SET NOT NULL`);
    }
} 