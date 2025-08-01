import { Controller, Get, Post, Put, UseGuards, Request, Body, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SessionProgressService } from './session-progress.service';

@UseGuards(JwtAuthGuard)
@Controller('session-progress')
export class SessionProgressController {
    constructor(private sessionProgressService: SessionProgressService) { }

    @Get()
    async getSessionProgress(@Request() req) {
        return this.sessionProgressService.getSessionProgress(req.user.id);
    }

    @Put()
    async updateSessionProgress(@Request() req, @Body() progressData: any) {
        return this.sessionProgressService.updateSessionProgress(req.user.id, {
            ...progressData,
            lastUpdated: new Date()
        });
    }

    @Delete()
    async resetSessionProgress(@Request() req) {
        return this.sessionProgressService.resetSessionProgress(req.user.id);
    }
} 