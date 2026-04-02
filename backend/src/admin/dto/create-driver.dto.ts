import { IsString, IsNumber, IsUUID, IsOptional, Min, MinLength, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDriverDto {
  // Option A: link to existing user
  @IsOptional() @IsUUID() userId?: string;

  // Option B: create new user on the fly
  @IsOptional() @IsEmail()    email?: string;
  @IsOptional() @IsString()   firstName?: string;
  @IsOptional() @IsString()   lastName?: string;
  @IsOptional() @IsString()   phone?: string;
  @IsOptional() @IsString()   password?: string;

  @IsString() @MinLength(3) licenseNumber: string;
  @IsNumber() @Min(0) @Type(() => Number) experienceYears: number;
  @IsOptional() @IsString() licenseDocumentUrl?: string;
  @IsOptional() @IsString() insuranceDocumentUrl?: string;
  @IsOptional() @IsString() photo?: string;
}
