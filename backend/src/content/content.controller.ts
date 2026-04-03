import { Controller, Get, Put, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ContentService } from './content.service';
import { UpdateSiteContentDto } from './dto/content.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
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
  @UseGuards(AuthGuard)
  updateSection(@Param('section') section: string, @Body() updateDto: UpdateSiteContentDto, @Req() req) {
    if (!req.user.is_admin) throw new ForbiddenException("Accès refusé");
    return this.contentService.updateSection(section, updateDto);
  }
}
