import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { EmailService } from "../email/email.service";


@Injectable()
export class MagicLinkService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) { }

  async generateMagicLink(email: string): Promise<void> {
    const magicToken = this.jwtService.sign(
      { email, type: "magic-link" },
      { expiresIn: "15m" }
    );

    const loginUrl = `${process.env.FRONTEND_URL}/auth/verify?token=${magicToken}`;
    await this.emailService.sendMagicLinkEmail(email, loginUrl);
  }

  async verifyMagicLink(token: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(token);

      if (payload.type !== "magic-link") {
        throw new Error("Invalid token type");
      }

      let user = await this.userRepository.findOne({
        where: { email: payload.email }
      });

      if (!user) {
        user = this.userRepository.create({
          email: payload.email,
          username: payload.email.split("@")[0],
          password: null,
        });
        await this.userRepository.save(user);
      }

      const sessionToken = this.jwtService.sign(
        { email: user.email, sub: user.id },
        { expiresIn: "90d" }
      );

      return {
        access_token: sessionToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      };
    } catch (error) {
      throw new Error("Invalid or expired magic link");
    }
  }
}
