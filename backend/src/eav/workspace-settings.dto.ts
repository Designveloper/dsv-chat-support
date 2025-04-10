import { IsOptional, IsBoolean, IsString } from "class-validator";

export class UpdateWorkspaceSettingsDto {
    @IsOptional() @IsString() presenceDetection?: string;
    @IsOptional() @IsString() visitorIdentification?: string;
    @IsOptional() @IsString() noResponseAction?: string;
    @IsOptional() @IsString() noResponseDelay?: string;
    @IsOptional() @IsBoolean() showUnreadCount?: boolean;
    @IsOptional() @IsBoolean() playSound?: boolean;
}