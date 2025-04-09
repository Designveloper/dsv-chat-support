import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EavService } from './eav.service';
import { EavEntityType } from './entities/eav-entity-type.entity';
import { EavAttributes } from './entities/eav-attributes.entity';
import { WorkspaceEntityVarchar } from './entities/workspace-entity-varchar.entity';
import { WorkspaceEntityBoolean } from './entities/workspace-entity-boolean.entity';
import { WorkspaceEntityInteger } from './entities/workspace-entity-integer.entity';
import { EavController } from './eav.controller';
import { WorkspaceSettingsService } from './workspace-settings.service';
import { WorkspaceSettingsController } from './workspace-settings.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            EavEntityType,
            EavAttributes,
            WorkspaceEntityVarchar,
            WorkspaceEntityBoolean,
            WorkspaceEntityInteger,
        ]),
    ],
    providers: [EavService, WorkspaceSettingsService],
    controllers: [EavController, WorkspaceSettingsController],
    exports: [EavService, WorkspaceSettingsService],
})
export class EavModule { }