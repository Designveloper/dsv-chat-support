import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class ConfirmEmailDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    code: string;
}