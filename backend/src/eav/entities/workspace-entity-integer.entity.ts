// src/eav/entities/workspace-entity-integer.entity.ts
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { EavAttributes } from './eav-attributes.entity';

@Entity('workspace_entity_integer')
export class WorkspaceEntityInteger {
    @PrimaryColumn()
    entity_id: string;

    @PrimaryColumn()
    att_id: number;

    @Column()
    value: number;

    @Column()
    created_at: Date;

    @Column({ nullable: true })
    updated_at: Date;

    @ManyToOne(() => EavAttributes)
    attribute: EavAttributes;
}