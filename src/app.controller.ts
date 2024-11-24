import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Application Health' })
  @ApiResponse({
    status: 200,
    description: 'Application Health.',
  })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
