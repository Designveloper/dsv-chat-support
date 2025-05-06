import { Controller, Get, Param, Query } from '@nestjs/common';
import { EavService } from './eav.service';

@Controller('eav')
export class EavController {
    constructor(private readonly eavService: EavService) { }

    // @Get('attributes/:entityId')
    // async getAttributes(
    //     @Param('entityId') entityId: string,
    //     @Query('entityTypeId') entityTypeId?: number,
    // ) {
    //     return this.eavService.getEntityAttributes(entityId, entityTypeId);
    // }
}