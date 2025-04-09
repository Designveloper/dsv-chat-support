import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { WorkSpace } from '../../workspace/workspace.entity';

@Entity('eav_entity_type')
export class EavEntityType {
    @PrimaryGeneratedColumn()
    type_id: number;

    @Column({ unique: true })
    type_code: string;

    @Column({ nullable: true })
    description: string;

    @Column()
    created_at: Date;

    @Column({ nullable: true })
    updated_at: Date;

    @OneToMany(() => WorkSpace, (workSpace) => workSpace.entityType)
    workSpaces: WorkSpace[];
}