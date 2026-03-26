import { IsString, IsNumber, IsEnum, IsOptional, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { VehicleStatus } from '../../entities/vehicle.entity';

export class CreateVehicleDto {
  @IsString() @MinLength(1) brand: string;
  @IsString() @MinLength(1) model: string;
  @IsNumber() @Min(1900) @Type(() => Number) year: number;
  @IsString() @MinLength(1) registration: string;
  @IsNumber() @Min(0) @Type(() => Number) pricePerDay: number;
  @IsOptional() @IsEnum(VehicleStatus) status?: VehicleStatus;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() description?: string;
}

export class UpdateVehicleDto {
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @IsNumber() @Min(1900) @Type(() => Number) year?: number;
  @IsOptional() @IsString() registration?: string;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) pricePerDay?: number;
  @IsOptional() @IsEnum(VehicleStatus) status?: VehicleStatus;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() description?: string;
}
