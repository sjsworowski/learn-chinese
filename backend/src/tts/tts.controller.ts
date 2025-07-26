import { Controller, Post, Body, Res, UseGuards } from '@nestjs/common';
import { TtsService } from './tts.service';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TtsDto } from './dto/tts.dto';

@UseGuards(JwtAuthGuard)
@Controller('tts')
export class TtsController {
    constructor(private readonly ttsService: TtsService) { }

    @Post()
    async synthesize(@Body() ttsDto: TtsDto, @Res() res: Response) {
        const audioBuffer = await this.ttsService.synthesize(ttsDto.text);
        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Disposition': 'inline; filename="output.mp3"',
        });
        res.send(audioBuffer);
    }
}
