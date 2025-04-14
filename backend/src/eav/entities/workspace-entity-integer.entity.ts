import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { EavAttributes } from './eav-attributes.entity';
import { WorkSpace } from '../../workspace/workspace.entity';

@Entity('workspace_entity_integer')
export class WorkspaceEntityInteger {
    @PrimaryGeneratedColumn()
    value_id: number;

    @Column()
    entity_id: string;

    @Column()
    att_id: number;

    @Column()
    value: number;

    @Column()
    created_at: Date;

    @Column({ nullable: true })
    updated_at: Date;

    @ManyToOne(() => EavAttributes)
    @JoinColumn({ name: "att_id" })
    attribute: EavAttributes;

    @ManyToOne(() => WorkSpace)
    @JoinColumn({ name: "entity_id" })
    workSpace: WorkSpace;
}