import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class AddUserMistake1753041355004 implements MigrationInterface {
    name = 'AddUserMistake1753041355004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "user_mistake",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "uuid_generate_v4()",
                    },
                    {
                        name: "userId",
                        type: "uuid",
                    },
                    {
                        name: "wordId",
                        type: "uuid",
                    },
                    {
                        name: "testType",
                        type: "enum",
                        enum: ["test", "pinyin-test", "listen-test"],
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "now()",
                    },
                ],
            }),
            true
        );

        await queryRunner.createForeignKey(
            "user_mistake",
            new TableForeignKey({
                columnNames: ["userId"],
                referencedColumnNames: ["id"],
                referencedTableName: "user",
                onDelete: "CASCADE",
            })
        );

        await queryRunner.createForeignKey(
            "user_mistake",
            new TableForeignKey({
                columnNames: ["wordId"],
                referencedColumnNames: ["id"],
                referencedTableName: "vocabulary",
                onDelete: "CASCADE",
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("user_mistake");
        if (table) {
            const foreignKeys = table.foreignKeys;
            for (const foreignKey of foreignKeys) {
                await queryRunner.dropForeignKey("user_mistake", foreignKey);
            }
        }
        await queryRunner.dropTable("user_mistake");
    }
} 