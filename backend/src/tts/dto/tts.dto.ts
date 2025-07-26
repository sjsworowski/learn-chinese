import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class TtsDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(1, { message: 'Text cannot be empty' })
    @MaxLength(100, { message: 'Text cannot exceed 500 characters' })
    text: string;
}
