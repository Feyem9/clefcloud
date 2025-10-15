import { IsString, IsOptional, IsIn, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePartitionDto {
  @ApiProperty({ example: 'Ave Maria' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Schubert', required: false })
  @IsOptional()
  @IsString()
  composer?: string;

  @ApiProperty({ example: 'Do majeur', required: false })
  @IsOptional()
  @IsString()
  key?: string;

  @ApiProperty({ example: 'messe', enum: ['messe', 'concert', 'autre'] })
  @IsIn(['messe', 'concert', 'autre'])
  category: string;

  @ApiProperty({ example: 'Kyrie', required: false })
  @IsOptional()
  @IsString()
  messePart?: string;

  @ApiProperty({ example: ['classique', 'liturgique'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
