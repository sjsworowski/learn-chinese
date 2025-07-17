import { Controller, Get, Post, Put, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SessionProgressService } from './session-progress.service';

@UseGuards(JwtAuthGuard)
@Controller('session-progress')
export class SessionProgressController {
    constructor(private sessionProgressService: SessionProgressService) { }

    @Get()
    async getSessionProgress(@Request() req) {
        return this.sessionProgressService.getSessionProgress(req.user.userId);
    }

    @Put()
    async updateSessionProgress(@Request() req) {
        const { currentSession, totalStudyTime } = req.body;
        return this.sessionProgressService.updateSessionProgress(req.user.userId, {
            currentSession,
            totalStudyTime
        });
    }

    @Post('reset')
    async resetSessionProgress(@Request() req) {
        return this.sessionProgressService.resetSessionProgress(req.user.userId);
    }
} 