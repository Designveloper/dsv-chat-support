// src/eav/eav.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EavAttributes } from './entities/eav-attributes.entity';
import { WorkspaceEntityVarchar } from './entities/workspace-entity-varchar.entity';
import { WorkspaceEntityBoolean } from './entities/workspace-entity-boolean.entity';
import { WorkspaceEntityInteger } from './entities/workspace-entity-integer.entity';
import { WorkspaceEntityText } from './entities/workspace-entity-text.entity';
import { EavEntityType } from './entities/eav-entity-type.entity';
import { DataSource } from 'typeorm';

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
        @InjectRepository(WorkspaceEntityText)
        private readonly textRepository: Repository<WorkspaceEntityText>,
        @InjectRepository(EavEntityType)
        private readonly entityTypeRepository: Repository<EavEntityType>,
        private readonly dataSource: DataSource
    ) {
        // Map backend_type to repositories
        this.valueRepositories = {
            varchar: this.varcharRepository,
            boolean: this.booleanRepository,
            int: this.integerRepository,
            text: this.textRepository,
        };
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

    async createAttribute({
        attCode,
        entityTypeId,
        backendType
    }: {
        attCode: string,
        entityTypeId: number,
        backendType: string
    }): Promise<EavAttributes> {
        try {
            let attribute = await this.attributesRepository.findOne({
                where: {
                    att_code: attCode,
                    entity_type_id: entityTypeId
                }
            });

            if (attribute) {
                return attribute;
            }

            const entityType = await this.entityTypeRepository.findOneBy({ type_id: entityTypeId });

            if (!entityType) {
                throw new Error(`Entity type with ID ${entityTypeId} not found`);
            }

            attribute = this.attributesRepository.create({
                att_code: attCode,
                entity_type_id: entityTypeId,
                backend_type: backendType,
                created_at: new Date(),
            });

            await this.attributesRepository.save(attribute);
            return attribute;
        } catch (error) {
            this.logger.error(`Error creating attribute ${attCode}: ${error.message}`);
            console.error(`Error creating attribute ${attCode}:`, error);
            throw error;
        }
    }

    async fetchAttributeValues(
        backendType: 'boolean' | 'varchar' | 'int' | 'text',
        entityId: string,
        attributeCodes: string[]
    ): Promise<any[]> {
        const repository = this.valueRepositories[backendType];

        return repository
            .createQueryBuilder('v')
            .innerJoinAndSelect(
                'v.attribute',
                'attr',
                'v.att_id = attr.att_id'
            )
            .where('v.entity_id = :entityId', { entityId })
            .andWhere('attr.backend_type = :type', { type: backendType })
            .andWhere('attr.att_code IN (:...codes)', { codes: attributeCodes })
            .getMany();
    }

    async getAttributeValue(entityId: string, attCode: string): Promise<any> {
        const attribute = await this.attributesRepository.findOne({
            where: { att_code: attCode },
        });
        if (!attribute) {
            const errorMessage = `Attribute '${attCode}' not found`;
            throw new Error(errorMessage);
        }

        const repository = this.valueRepositories[attribute.backend_type];
        if (!repository) {
            const errorMessage = `Unsupported backend_type: ${attribute.backend_type}`;
            throw new Error(errorMessage);
        }

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
        });

        if (!entityData) {
            return {}; // or throw an error if entity type is not found
        }

        const results: Record<string, any> = {};

        if (!attributeCodes.length) {
            return results;
        }

        // Create a single query that fetches values from all three tables
        const [booleanValues, varcharValues, intValues, textValues] = await Promise.all([
            this.fetchAttributeValues('boolean', entityId, attributeCodes),
            this.fetchAttributeValues('varchar', entityId, attributeCodes),
            this.fetchAttributeValues('int', entityId, attributeCodes),
            this.fetchAttributeValues('text', entityId, attributeCodes),
        ]);

        console.log('Fetched boolean values:', booleanValues);

        const valueGroups = {
            boolean: booleanValues,
            varchar: varcharValues,
            int: intValues,
            text: textValues,
        };

        Object.keys(valueGroups).forEach(type => {
            const values = valueGroups[type];
            if (values && values.length > 0) {
                values.forEach(item => {
                    if (item && item.attribute) {
                        results[item.attribute.att_code] = item.value;
                    }
                });
            }
        });

        this.logger.log(`Fetched attributes for entityId: ${entityId}`);
        return results;
    }

    async setEntityAttributes({
        entityId,
        entityTypeCode,
        attributes
    }: {
        entityId: string,
        entityTypeCode: string,
        attributes: { code: string, type: string, value: any }[]
    }): Promise<void> {
        await this.dataSource.transaction(async (transactionalEntityManager) => {
            const entityData = await transactionalEntityManager.findOne(EavEntityType, {
                where: { type_code: entityTypeCode },
            });

            if (!entityData) {
                throw new Error(`Entity type '${entityTypeCode}' not found`);
            }

            const attributeCodes = attributes.map(attr => attr.code);
            const existingAttributes = await transactionalEntityManager.find(EavAttributes, {
                where: {
                    att_code: In(attributeCodes),
                    entity_type_id: entityData.type_id
                }
            });

            const attributeMap = {};
            existingAttributes.forEach(attr => {
                attributeMap[attr.att_code] = attr;
            });

            const missingAttributes = attributes.filter(attr => !attributeMap[attr.code]);

            if (missingAttributes.length > 0) {
                await Promise.all(missingAttributes.map(async attr => {
                    try {
                        const newAttribute = transactionalEntityManager.create(EavAttributes, {
                            att_code: attr.code,
                            entity_type_id: entityData.type_id,
                            backend_type: attr.type,
                            created_at: new Date()
                        });

                        await transactionalEntityManager.save(newAttribute);
                        attributeMap[attr.code] = newAttribute;
                        this.logger.log(`Created attribute ${attr.code} of type ${attr.type}`);
                    } catch (error) {
                        throw error;
                    }
                }));
            }

            const now = new Date();

            const booleanValues: { entity_id: string; att_id: number; value: boolean; created_at: Date; updated_at: Date }[] = [];
            const varcharValues: { entity_id: string; att_id: number; value: string; created_at: Date; updated_at: Date }[] = [];
            const intValues: { entity_id: string; att_id: number; value: number; created_at: Date; updated_at: Date }[] = [];
            const textValues: { entity_id: string; att_id: number; value: string; created_at: Date; updated_at: Date }[] = [];

            attributes.forEach(attr => {
                const attributeInfo = attributeMap[attr.code];
                if (!attributeInfo) {
                    return;
                }

                const attributeId = attributeInfo.att_id;

                if (attributeInfo.backend_type !== attr.type) {
                    return;
                }

                const valueObject = {
                    entity_id: entityId,
                    att_id: attributeId,
                    value: attr.value,
                    created_at: now,
                    updated_at: now
                };

                switch (attr.type) {
                    case 'boolean':
                        booleanValues.push(valueObject);
                        break;
                    case 'varchar':
                        varcharValues.push(valueObject);
                        break;
                    case 'int':
                        intValues.push(valueObject);
                        break;
                    case 'text':
                        textValues.push(valueObject);
                        break;
                    default:
                        break;
                }
            });

            const promises: Promise<any>[] = [];

            const valueMap = [
                { values: booleanValues, entity: WorkspaceEntityBoolean },
                { values: varcharValues, entity: WorkspaceEntityVarchar },
                { values: intValues, entity: WorkspaceEntityInteger },
                { values: textValues, entity: WorkspaceEntityText }
            ];

            valueMap.forEach(({ values, entity }) => {
                if (values.length > 0) {
                    promises.push(
                        transactionalEntityManager
                            .createQueryBuilder()
                            .insert()
                            .into(entity)
                            .values(values as any[])
                            .orUpdate(['value', 'updated_at'], ['entity_id', 'att_id'])
                            .execute()
                    );
                    this.logger.log(`Inserted/Updated ${values.length} values for entity type ${entity.name}`);
                }
            });
            if (promises.length > 0) {
                await Promise.all(promises);
                this.logger.log(`Updated attributes for entity ${entityId}`);
            }
        }).catch(error => {
            this.logger.error(`Error setting attributes for entity ${entityId}: ${error.message}`);
            throw error;
        });
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
            return;
        }
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
        return;
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

    async setTextValue(entityId: string, attCode: string, value: string): Promise<void> {
        this.logger.log(`Setting text value for entityId: ${entityId}, attCode: ${attCode}, value: ${value}`);

        const attribute = await this.attributesRepository.findOne({
            where: { att_code: attCode },
        });

        if (!attribute) {
            throw new Error(`Attribute '${attCode}' not found`);
        }

        if (attribute.backend_type !== 'text') {
            throw new Error(`Attribute '${attCode}' is not a text type`);
        }

        // Check if value already exists
        let existingValue = await this.textRepository.findOne({
            where: { entity_id: entityId, att_id: attribute.att_id },
        });

        const now = new Date();

        if (existingValue) {
            // Update existing value
            existingValue.value = value;
            existingValue.updated_at = now;
            await this.textRepository.save(existingValue);
        } else {
            // Create new value
            const newValue = this.textRepository.create({
                entity_id: entityId,
                att_id: attribute.att_id,
                value: value,
                created_at: now,
                updated_at: now,
            });
            await this.textRepository.save(newValue);
        }
    }
}