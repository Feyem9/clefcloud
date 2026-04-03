import { IsString, IsInt, Min, Max, IsBoolean, IsOptional } from 'class-validator';

export class CreateTestimonialDto {
  @IsString()
  content: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;
}

export class UpdateTestimonialDto {
  @IsBoolean()
  is_published: boolean;
}
