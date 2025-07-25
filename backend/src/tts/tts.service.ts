import { Injectable } from '@nestjs/common';
import * as textToSpeech from '@google-cloud/text-to-speech';

@Injectable()
export class TtsService {
    private client: textToSpeech.TextToSpeechClient;

    constructor() {
        this.client = new textToSpeech.TextToSpeechClient();
    }

    async synthesize(text: string): Promise<Buffer> {
        const request = {
            input: { text },
            voice: {
                languageCode: 'cmn-CN', // Mandarin Chinese
                ssmlGender: textToSpeech.protos.google.cloud.texttospeech.v1.SsmlVoiceGender.FEMALE,
            },
            audioConfig: {
                audioEncoding: textToSpeech.protos.google.cloud.texttospeech.v1.AudioEncoding.MP3,
            },
        };
        const [response] = await this.client.synthesizeSpeech(request);
        return Buffer.from(response.audioContent as Uint8Array);
    }
}
