// src/eav/entities/workspace-entity-varchar.entity.ts
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { EavAttributes } from './eav-attributes.entity';

@Entity('workspace_entity_varchar')
export class WorkspaceEntityVarchar {
    @PrimaryColumn()
    entity_id: string;

    @PrimaryColumn()
    att_id: number;

    @Column()
    value: string;

    @Column()
    created_at: Date;

    @Column({ nullable: true })
    updated_at: Date;

    @ManyToOne(() => EavAttributes)
    attribute: EavAttributes;
}