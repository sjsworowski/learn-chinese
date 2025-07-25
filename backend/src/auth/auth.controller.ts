import { Controller, Post, Body, Get, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    async login(@Body() loginDto: { email: string; password: string; rememberMe?: boolean }) {
        const user = await this.authService.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.authService.login(user, loginDto.rememberMe);
    }

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        const user = await this.authService.register(
            registerDto.email,
            registerDto.username,
            registerDto.password,
        );
        // Always use default expiry (1d) after registration
        return this.authService.login(user, false);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getProfile(@Request() req) {
        const user = await this.authService.findById(req.user.userId);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        return {
            id: user.id,
            email: user.email,
            username: user.username,
        };
    }
} 