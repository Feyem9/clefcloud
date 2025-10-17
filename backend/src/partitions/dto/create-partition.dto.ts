import { IsString, IsOptional, IsIn, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

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
  @Transform(({ value }) => {
    // Si c'est déjà un array, le retourner
    if (Array.isArray(value)) return value;
    // Si c'est une string JSON, la parser
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        // Si ce n'est pas du JSON, split par virgule
        return value.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
    }
    return [];
  })
  tags?: string[];
}
