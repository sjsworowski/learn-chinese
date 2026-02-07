import { Controller, Post, Body, Get, UseGuards, Request, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LocalAuthGuard } from './local-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Request() req) {
        return this.authService.findById(req.user.id);
    }

    @Post('register')
    async register(
        @Body() body: { email: string; password: string; username?: string },
    ) {
        return this.authService.register(body.email, body.password, body.username);
    }

    @Post('verify-email')
    async verifyEmail(@Body() body: { token: string }) {
        return this.authService.verifyEmail(body.token);
    }

    @Post('resend-verification')
    async resendVerification(@Body() body: { email: string }) {
        return this.authService.resendVerificationEmail(body.email);
    }

    @Get('verification-status')
    async verificationStatus(@Query('email') email?: string) {
        if (!email || typeof email !== 'string') {
            return { verified: false };
        }
        return this.authService.getVerificationStatus(email.trim());
    }

    @Post('login')
    @UseGuards(LocalAuthGuard)
    async login(@Request() req, @Body() body: { rememberMe?: boolean }) {
        return this.authService.login(req.user, body.rememberMe ?? true);
    }
}
