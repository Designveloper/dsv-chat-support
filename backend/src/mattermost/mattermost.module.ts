import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MattermostService } from './mattermost.service';
import { MattermostController } from './mattermost.controller';
import { WorkspaceModule } from 'src/workspace/workspace.module';

@Module({
    imports: [
        ConfigModule,
        WorkspaceModule,
    ],
    providers: [MattermostService],
    controllers: [MattermostController],
    exports: [MattermostService],
})
export class MattermostModule { }