// src/eav/eav.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EavAttributes } from './entities/eav-attributes.entity';
import { WorkspaceEntityVarchar } from './entities/workspace-entity-varchar.entity';
import { WorkspaceEntityBoolean } from './entities/workspace-entity-boolean.entity';
import { WorkspaceEntityInteger } from './entities/workspace-entity-integer.entity';
import { EavEntityType } from './entities/eav-entity-type.entity';

@Injectable()
export class EavService {
    private readonly valueRepositories: Record<string, Repository<any>>;
    private readonly logger = new Logger(EavService.name);

    constructor(
        @InjectRepository(EavAttributes)
        private readonly attributesRepository: Repository<EavAttributes>,
        @InjectRepository(WorkspaceEntityVarchar)
        private readonly varcharRepository: Repository<WorkspaceEntityVarchar>,
        @InjectRepository(WorkspaceEntityBoolean)
        private readonly booleanRepository: Repository<WorkspaceEntityBoolean>,
        @InjectRepository(WorkspaceEntityInteger)
        private readonly integerRepository: Repository<WorkspaceEntityInteger>,
        @InjectRepository(EavEntityType)
        private readonly entityTypeRepository: Repository<EavEntityType>,
    ) {
        // Map backend_type to repositories
        this.valueRepositories = {
            varchar: this.varcharRepository,
            boolean: this.booleanRepository,
            int: this.integerRepository,
        };

        // Log that service is constructed
        this.logger.log('EavService initialized');
        console.log('EavService initialized with repositories', {
            attributesRepo: !!this.attributesRepository,
            entityTypeRepo: !!this.entityTypeRepository,
            varcharRepo: !!this.varcharRepository,
            booleanRepo: !!this.booleanRepository,
            integerRepo: !!this.integerRepository
        });
    }

    async getOrCreateEntityType(typeCode: string, description?: string): Promise<EavEntityType> {
        console.log('============= STARTING getOrCreateEntityType =============');
        this.logger.log(`Looking for entity type with code: ${typeCode}`);
        console.log('Looking for entity type with code:', typeCode);

        try {
            // Check if entity type exists
            console.log('About to query database for entity type');
            let entityType = await this.entityTypeRepository.findOne({
                where: { type_code: typeCode }
            });

            console.log('Entity repository find result:', entityType ? 'Found' : 'Not found');

            // If not, create it
            if (!entityType) {
                console.log('Creating new entity type:', typeCode);
                this.logger.log(`Creating new entity type: ${typeCode}`);
                entityType = this.entityTypeRepository.create({
                    type_code: typeCode,
                    description: description || `Entity type for ${typeCode}`,
                    created_at: new Date()
                });

                try {
                    console.log('About to save new entity type');
                    await this.entityTypeRepository.save(entityType);
                    console.log('Successfully created entity type:', entityType);
                } catch (error) {
                    console.error('ERROR SAVING ENTITY TYPE:', error);
                    this.logger.error(`Error saving entity type: ${error.message}`, error.stack);
                    throw error;
                }
            } else {
                console.log('Using existing entity type:', entityType);
            }

            console.log('============= FINISHED getOrCreateEntityType =============');
            return entityType;
        } catch (error) {
            console.error('CRITICAL ERROR in getOrCreateEntityType:', error);
            this.logger.error(`Critical error in getOrCreateEntityType: ${error.message}`, error.stack);
            throw error;
        }
    }

    async getAttributeByCode(attCode: string): Promise<EavAttributes | null> {
        try {
            this.logger.log(`Looking for attribute with code: ${attCode}`);
            return await this.attributesRepository.findOne({
                where: { att_code: attCode },
                relations: ['entity_type'],
            });
        } catch (error) {
            this.logger.error(`Error getting attribute ${attCode}: ${error.message}`);
            return null;
        }
    }

    async createAttribute(attCode: string, entityTypeId: number, backendType: string): Promise<EavAttributes> {
        try {
            // Log the request
            this.logger.log(`Creating attribute ${attCode} for entity type ${entityTypeId} with type ${backendType}`);
            console.log(`Creating attribute ${attCode} for entity type ${entityTypeId} with type ${backendType}`);

            // Check if attribute already exists first to prevent duplicates
            const existingAttribute = await this.attributesRepository.findOne({
                where: { att_code: attCode },
            });

            if (existingAttribute) {
                console.log(`Attribute ${attCode} already exists, returning existing`);
                return existingAttribute;
            }

            // Get entity type
            const entityType = await this.entityTypeRepository.findOneBy({ type_id: entityTypeId });

            if (!entityType) {
                throw new Error(`Entity type with ID ${entityTypeId} not found`);
            }

            // Create attribute
            const attribute = this.attributesRepository.create({
                att_code: attCode,
                entity_type: entityType,
                backend_type: backendType,
                created_at: new Date(),
            });

            // Save the attribute and log the result
            const savedAttribute = await this.attributesRepository.save(attribute);
            this.logger.log(`Successfully created attribute ${attCode} with ID ${savedAttribute.att_id}`);
            console.log(`Successfully created attribute ${attCode} with ID ${savedAttribute.att_id}`);

            return savedAttribute;
        } catch (error) {
            this.logger.error(`Error creating attribute ${attCode}: ${error.message}`);
            console.error(`Error creating attribute ${attCode}:`, error);
            throw error;
        }
    }

    async getAttributeValue(entityId: string, attCode: string): Promise<any> {
        this.logger.log(`Fetching attribute value for entityId: ${entityId}, attCode: ${attCode}`);
        console.log(`Fetching attribute value for entityId: ${entityId}, attCode: ${attCode}`);

        // Get the attribute
        const attribute = await this.attributesRepository.findOne({
            where: { att_code: attCode },
        });
        if (!attribute) {
            const errorMessage = `Attribute '${attCode}' not found`;
            throw new Error(errorMessage);
        }

        // Select the correct repository based on backend_type
        const repository = this.valueRepositories[attribute.backend_type];
        if (!repository) {
            const errorMessage = `Unsupported backend_type: ${attribute.backend_type}`;
            throw new Error(errorMessage);
        }

        // Query the value
        const valueEntity = await repository.findOne({
            where: { entity_id: entityId, att_id: attribute.att_id },
        });

        const value = valueEntity ? valueEntity.value : null;
        console.log(`Fetched value for attCode: ${attCode}, value: ${value}`);
        return value;
    }

    async getEntityAttributes({ entityId, entityTypeCode, attributeCodes }: { entityId: string, entityTypeCode: string, attributeCodes: string[] }): Promise<Record<string, any>> {

        const entityData = await this.entityTypeRepository.findOne({
            where: { type_code: entityTypeCode },
        })

        if (!entityData) {
            return {}; // or throw an error if entity type is not found
        }


        const results: Record<string, any> = {};

        const booleanValues = await this.booleanRepository
            .createQueryBuilder('bv')
            .innerJoin(
                'eav_attributes',
                'attr',
                'bv.att_id = attr.att_id'
            )
            .where('bv.entity_id = :entityId', { entityId })
            .andWhere('attr.backend_type = :type', { type: 'boolean' })
            .andWhere('attr.att_code IN (:...codes)', { codes: attributeCodes })
            .select([
                'bv.value AS value',
                'attr.att_code AS att_code'
            ])
            .getRawMany();

        booleanValues.forEach(item => {
            results[item.att_code] = item.value;
        });

        const varcharValues = await this.varcharRepository
            .createQueryBuilder('vv')
            .innerJoin(
                'eav_attributes',
                'attr',
                'vv.att_id = attr.att_id'
            )
            .where('vv.entity_id = :entityId', { entityId })
            .andWhere('attr.backend_type = :type', { type: 'varchar' })
            .andWhere('attr.att_code IN (:...codes)', { codes: attributeCodes })
            .select([
                'vv.value AS value',
                'attr.att_code AS att_code'
            ])
            .getRawMany();

        varcharValues.forEach(item => {
            results[item.att_code] = item.value;
        });

        const intValues = await this.integerRepository
            .createQueryBuilder('iv')
            .innerJoin(
                'eav_attributes',
                'attr',
                'iv.att_id = attr.att_id'
            )
            .where('iv.entity_id = :entityId', { entityId })
            .andWhere('attr.backend_type = :type', { type: 'int' })
            .andWhere('attr.att_code IN (:...codes)', { codes: attributeCodes })
            .select([
                'iv.value AS value',
                'attr.att_code AS att_code'
            ])
            .getRawMany();

        // Process integer values
        intValues.forEach(item => {
            results[item.att_code] = item.value;
        });

        this.logger.log(`Fetched attributes for entityId: ${entityId}`);
        console.log(`Fetched attributes for entityId: ${entityId}`);
        return results;
    }

    async setBooleanValue(entityId: string, attCode: string, value: boolean): Promise<void> {
        this.logger.log(`Setting boolean value for entityId: ${entityId}, attCode: ${attCode}, value: ${value}`);

        const attribute = await this.attributesRepository.findOne({
            where: { att_code: attCode },
        });

        if (!attribute) {
            throw new Error(`Attribute '${attCode}' not found`);
        }

        if (attribute.backend_type !== 'boolean') {
            throw new Error(`Attribute '${attCode}' is not a boolean type`);
        }

        // Check if value already exists
        let existingValue = await this.booleanRepository.findOne({
            where: { entity_id: entityId, att_id: attribute.att_id },
        });
        console.log("🚀 ~ EavService ~ setBooleanValue ~ existingValue:", existingValue)

        const now = new Date();

        if (existingValue) {
            // Update existing value
            existingValue.value = value;
            existingValue.updated_at = now;
            await this.booleanRepository.save(existingValue);
            console.log("1111")
        } else {
            // Create new value
            const newValue = this.booleanRepository.create({
                entity_id: entityId,
                att_id: attribute.att_id,
                value: value,
                created_at: now,
                updated_at: now,
            });
            console.log("🚀 ~ EavService ~ setBooleanValue ~ newValue:", newValue)
            await this.booleanRepository.save(newValue);
            console.log("2222")
        }
    }

    async setVarcharValue(entityId: string, attCode: string, value: string): Promise<void> {
        this.logger.log(`Setting varchar value for entityId: ${entityId}, attCode: ${attCode}, value: ${value}`);

        const attribute = await this.attributesRepository.findOne({
            where: { att_code: attCode },
        });

        if (!attribute) {
            throw new Error(`Attribute '${attCode}' not found`);
        }

        if (attribute.backend_type !== 'varchar') {
            throw new Error(`Attribute '${attCode}' is not a varchar type`);
        }

        // Check if value already exists
        let existingValue = await this.varcharRepository.findOne({
            where: { entity_id: entityId, att_id: attribute.att_id },
        });

        const now = new Date();

        if (existingValue) {
            // Update existing value
            existingValue.value = value;
            existingValue.updated_at = now;
            await this.varcharRepository.save(existingValue);
        } else {
            // Create new value
            const newValue = this.varcharRepository.create({
                entity_id: entityId,
                att_id: attribute.att_id,
                value: value,
                created_at: now,
                updated_at: now,
            });
            await this.varcharRepository.save(newValue);
        }
    }

    async setIntegerValue(entityId: string, attCode: string, value: number): Promise<void> {
        this.logger.log(`Setting integer value for entityId: ${entityId}, attCode: ${attCode}, value: ${value}`);

        const attribute = await this.attributesRepository.findOne({
            where: { att_code: attCode },
        });

        if (!attribute) {
            throw new Error(`Attribute '${attCode}' not found`);
        }

        if (attribute.backend_type !== 'int') {
            throw new Error(`Attribute '${attCode}' is not an integer type`);
        }

        // Check if value already exists
        let existingValue = await this.integerRepository.findOne({
            where: { entity_id: entityId, att_id: attribute.att_id },
        });

        const now = new Date();

        if (existingValue) {
            // Update existing value
            existingValue.value = value;
            existingValue.updated_at = now;
            await this.integerRepository.save(existingValue);
        } else {
            // Create new value
            const newValue = this.integerRepository.create({
                entity_id: entityId,
                att_id: attribute.att_id,
                value: value,
                created_at: now,
                updated_at: now,
            });
            await this.integerRepository.save(newValue);
        }
    }
}