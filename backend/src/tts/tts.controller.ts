import { Controller, Post, Body, Res } from '@nestjs/common';
import { TtsService } from './tts.service';
import { Response } from 'express';

@Controller('tts')
export class TtsController {
    constructor(private readonly ttsService: TtsService) { }

    @Post()
    async synthesize(@Body('text') text: string, @Res() res: Response) {
        const audioBuffer = await this.ttsService.synthesize(text);
        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Disposition': 'inline; filename="output.mp3"',
        });
        res.send(audioBuffer);
    }
}
