import { DataSource } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getDatabaseConfig } from './database.config';

ConfigModule.forRoot({
    isGlobal: true,
});

const configService = new ConfigService();

const dataSource = new DataSource(getDatabaseConfig(configService));

export default dataSource;