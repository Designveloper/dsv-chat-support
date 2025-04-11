import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEavTablesAddValueId1744280067533 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE workspace_entity_varchar 
            DROP PRIMARY KEY,
            ADD value_id INT NOT NULL AUTO_INCREMENT UNIQUE,
            ADD PRIMARY KEY (value_id),
            ADD UNIQUE uq_entity_att_varchar (entity_id, att_id);

            ALTER TABLE workspace_entity_integer 
            DROP PRIMARY KEY,
            ADD value_id INT NOT NULL AUTO_INCREMENT UNIQUE,
            ADD PRIMARY KEY (value_id),
            ADD UNIQUE uq_entity_att_integer (entity_id, att_id);

            ALTER TABLE workspace_entity_boolean 
            DROP PRIMARY KEY,
            ADD value_id INT NOT NULL AUTO_INCREMENT UNIQUE,
            ADD PRIMARY KEY (value_id),
            ADD UNIQUE uq_entity_att_boolean (entity_id, att_id);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE workspace_entity_varchar
            DROP PRIMARY KEY,
            DROP INDEX uq_entity_att_varchar,
            DROP COLUMN value_id,
            ADD PRIMARY KEY (entity_id, att_id);

            ALTER TABLE workspace_entity_integer
            DROP PRIMARY KEY,
            DROP INDEX uq_entity_att_integer,
            DROP COLUMN value_id,
            ADD PRIMARY KEY (entity_id, att_id);

            ALTER TABLE workspace_entity_boolean
            DROP PRIMARY KEY,
            DROP INDEX uq_entity_att_boolean,
            DROP COLUMN value_id,
            ADD PRIMARY KEY (entity_id, att_id);
        `);
    }
}
