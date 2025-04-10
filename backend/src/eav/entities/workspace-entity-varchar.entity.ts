// src/eav/entities/workspace-entity-varchar.entity.ts
import { Column, Entity, ManyToOne, PrimaryColumn, JoinColumn } from 'typeorm';
import { EavAttributes } from './eav-attributes.entity';
import { WorkSpace } from '../../workspace/workspace.entity';

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
    @JoinColumn({ name: "att_id" })  // Specify the column name for the foreign key
    attribute: EavAttributes;

    @ManyToOne(() => WorkSpace)
    @JoinColumn({ name: "entity_id" })  // Specify the column name for the foreign key
    workSpace: WorkSpace;
}