import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EavEntityType } from './eav-entity-type.entity';

@Entity('eav_attributes')
export class EavAttributes {
    @PrimaryGeneratedColumn()
    att_id: number;

    @Column({ unique: true })
    att_code: string;

    @ManyToOne(() => EavEntityType, { nullable: false })
    entity_type: EavEntityType;

    @Column({ type: 'enum', enum: ['varchar', 'int', 'boolean', 'datetime'] })
    backend_type: string;

    @Column()
    created_at: Date;

    @Column({ nullable: true })
    updated_at: Date;


}