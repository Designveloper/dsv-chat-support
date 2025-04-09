import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { EavAttributes } from './eav-attributes.entity';

@Entity('workspace_entity_boolean')
export class WorkspaceEntityBoolean {
    @PrimaryColumn()
    entity_id: string;

    @PrimaryColumn()
    att_id: number;

    @Column()
    value: boolean;

    @Column()
    created_at: Date;

    @Column({ nullable: true })
    updated_at: Date;

    @ManyToOne(() => EavAttributes)
    attribute: EavAttributes;
}