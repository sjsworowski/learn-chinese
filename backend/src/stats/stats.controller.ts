import { Controller, Get, Post, Body, UseGuards, Request, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StatsService } from './stats.service';

@UseGuards(JwtAuthGuard)
@Controller('stats')
export class StatsController {
    constructor(private statsService: StatsService) { }

    @Get()
    async getStats(@Request() req) {
        return this.statsService.getStatsForUser(req.user.id);
    }

    @Post('session')
    async saveSession(@Request() req, @Body() sessionData: any) {
        return this.statsService.saveSession(req.user.id, sessionData);
    }

    @Post('test-completed')
    async recordTestCompleted(@Request() req) {
        return this.statsService.recordTestCompleted(req.user.id);
    }

    @Post('speed-challenge')
    async recordSpeedChallenge(@Request() req, @Body() body: { score: number; timeUsed: number }) {
        return this.statsService.recordSpeedChallenge(req.user.id, body);
    }

    @Get('speed-challenge/high-score')
    async getSpeedChallengeHighScore(@Request() req) {
        const highScore = await this.statsService.getSpeedChallengeHighScore(req.user.id);
        return { highScore };
    }

    @Delete('speed-challenge')
    async clearSpeedChallengeScores(@Request() req) {
        return this.statsService.clearSpeedChallengeScores(req.user.id);
    }
} 