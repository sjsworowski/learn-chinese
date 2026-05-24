import { Controller, Get, Put, Post, Body, Request, UseGuards, Param } from '@nestjs/common';
import { PartnerService } from './partner.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class PartnerController {
    constructor(private partnerService: PartnerService) { }

    @Get('partner/settings')
    @UseGuards(JwtAuthGuard)
    async getSettings(@Request() req) {
        return this.partnerService.getPartnerSettings(req.user.id);
    }

    @Put('partner/settings')
    @UseGuards(JwtAuthGuard)
    async updateSettings(@Request() req, @Body() body: { email: string }) {
        return this.partnerService.updatePartnerSettings(req.user.id, body.email);
    }

    @Post('partner/send-test')
    @UseGuards(JwtAuthGuard)
    async sendTest(@Request() req) {
        return this.partnerService.sendTestPartnerEmail(req.user.id);
    }

    // Public — no auth guard
    @Get('public/progress/:userId')
    async getPublicProgress(@Param('userId') userId: string) {
        return this.partnerService.getPublicProgress(userId);
    }
}