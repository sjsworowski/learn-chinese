import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService,
    ) { }

    async login(user: any, rememberMe?: boolean) {
        const payload = { email: user.email, sub: user.id };
        const expiresIn = rememberMe ? '30d' : '1d';
        return {
            access_token: this.jwtService.sign(payload, { expiresIn }),
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
            },
        };
    }

    async findById(id: string): Promise<any> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (user) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }
} 