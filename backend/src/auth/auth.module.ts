﻿import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { MagicLinkService } from './magic-link.service';
import { User } from '../entities/user.entity';

// Add logging
const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
console.log(' AuthModule JWT_SECRET:', jwtSecret);

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        PassportModule,
        ConfigModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const secret = configService.get<string>('JWT_SECRET', 'fallback-secret');
                console.log(' AuthModule JWT_SECRET from ConfigService:', secret);
                return {
                    secret: secret,
                    signOptions: { expiresIn: '7d' },
                };
            },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, MagicLinkService],
    exports: [AuthService],
})
export class AuthModule { }