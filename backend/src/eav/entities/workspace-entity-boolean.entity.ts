import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn, Index } from 'typeorm';
import { EavAttributes } from './eav-attributes.entity';
import { WorkSpace } from '../../workspace/workspace.entity';

@Entity('workspace_entity_boolean')
@Index(['entity_id', 'att_id'], { unique: true })
export class WorkspaceEntityBoolean {
    @PrimaryGeneratedColumn()
    value_id: number;

    @Column()
    entity_id: string;

    @Column()
    att_id: number;

    @Column()
    value: boolean;

    @Column()
    created_at: Date;

    @Column({ nullable: true })
    updated_at: Date;

    @ManyToOne(() => EavAttributes)
    @JoinColumn({ name: "att_id" })
    attribute: EavAttributes;

    @ManyToOne(() => WorkSpace, (workSpace) => workSpace.id)
    @JoinColumn({ name: "entity_id" })
    workSpace: WorkSpace;
}