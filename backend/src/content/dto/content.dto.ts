import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateSiteContentDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}
