// src/eav/entities/workspace-entity-integer.entity.ts
import { Column, Entity, ManyToOne, PrimaryColumn, JoinColumn } from 'typeorm';
import { EavAttributes } from './eav-attributes.entity';
import { WorkSpace } from '../../workspace/workspace.entity';

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
    @JoinColumn({ name: "att_id" })  // Specify the column name for the foreign key
    attribute: EavAttributes;

    @ManyToOne(() => WorkSpace)
    @JoinColumn({ name: "entity_id" })  // Specify the column name for the foreign key
    workSpace: WorkSpace;
}