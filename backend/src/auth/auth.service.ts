import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.userRepository.findOne({ where: { email } });
        console.log('Login attempt:', email, password);
        if (user) {
            console.log('User found:', user.email, user.password);
            const match = await bcrypt.compare(password, user.password);
            console.log('Password match:', match);
            if (match) {
                const { password, ...result } = user;
                return result;
            }
        }
        return null;
    }

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

    async register(email: string, username: string, password: string) {
        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new UnauthorizedException('User already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = this.userRepository.create({
            email,
            username,
            password: hashedPassword,
        });

        const savedUser = await this.userRepository.save(user);
        const { password: _, ...result } = savedUser;
        return result;
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