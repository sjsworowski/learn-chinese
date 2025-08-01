import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const appJwtSecret = process.env.JWT_SECRET || 'your-secret-key';
console.log('🔐 JwtStrategy JWT_SECRET:', appJwtSecret);

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET', 'your-secret-key'),
        });
    }

    async validate(payload: any) {
        return { id: payload.sub, email: payload.email };
    }
} 