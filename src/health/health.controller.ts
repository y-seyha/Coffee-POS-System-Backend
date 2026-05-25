import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {

    @Get()
    @ApiOperation({
        summary: 'Health check endpoint',
        description: 'Returns API health status and uptime information.',
    })
    @ApiResponse({
        status: 200,
        description: 'API is healthy',
        schema: {
            example: {
                status: 'ok',
                uptime: 1234.56,
                timestamp: '2026-05-25T15:30:00.000Z',
            },
        },
    })
    check() {
        return {
            status: 'ok',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        };
    }
}