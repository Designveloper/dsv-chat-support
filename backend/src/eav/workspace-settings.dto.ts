import { IsOptional, IsBoolean, IsString } from "class-validator";

export class UpdateWorkspaceSettingsDto {
    @IsOptional() @IsBoolean() autoUpdateStatus?: boolean;
    @IsOptional() @IsString() presenceDetection?: string;
    @IsOptional() @IsString() visitorIdentification?: string;
    @IsOptional() @IsBoolean() autoResponseEnabled?: boolean;
    @IsOptional() @IsString() autoResponseMessage?: string;
    @IsOptional() @IsString() offlineTransition?: string;
    @IsOptional() @IsBoolean() showUnreadCount?: boolean;
}