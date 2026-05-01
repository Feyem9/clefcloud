import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ContentService } from './content.service';
import { UpdateSiteContentDto } from './dto/content.dto';
import { AdminGuard } from '../common/guards/admin.guard';
import { Public } from '../common/decorators/public.decorator';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Public()
  @Get(':section')
  getSection(@Param('section') section: string) {
    return this.contentService.getSection(section);
  }

  @Put(':section')
  @UseGuards(AdminGuard)
  updateSection(@Param('section') section: string, @Body() updateDto: UpdateSiteContentDto) {
    return this.contentService.updateSection(section, updateDto);
  }
}
