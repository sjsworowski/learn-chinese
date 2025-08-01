﻿import { Controller, Post, Body, Get, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { MagicLinkService } from './magic-link.service';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private magicLinkService: MagicLinkService
    ) { }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Request() req) {
        const user = await this.authService.findById(req.user.id);
        return user;
    }

    @Post('magic-link/send')
    async sendMagicLink(@Body() body: { email: string }) {
        await this.magicLinkService.generateMagicLink(body.email);
        return { message: 'Magic link sent to your email' };
    }

    @Post('magic-link/verify')
    async verifyMagicLink(@Body() body: { token: string }) {
        return this.magicLinkService.verifyMagicLink(body.token);
    }
} 