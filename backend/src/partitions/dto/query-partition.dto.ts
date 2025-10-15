import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QueryPartitionDto {
  @ApiProperty({ required: false, example: 'messe' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false, example: 'Ave Maria' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, example: 50, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;

  @ApiProperty({ required: false, example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
