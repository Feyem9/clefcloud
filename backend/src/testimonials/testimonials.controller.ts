import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { TestimonialsService } from './testimonials.service';
import { CreateTestimonialDto, UpdateTestimonialDto } from './dto/testimonial.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Public } from '../common/decorators/public.decorator';

@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createTestimonialDto: CreateTestimonialDto, @Req() req) {
    return this.testimonialsService.create(createTestimonialDto, req.user);
  }

  @Public()
  @Get()
  findAllPublished() {
    return this.testimonialsService.findAllPublished();
  }

  @Get('admin')
  @UseGuards(AuthGuard)
  findAllForAdmin(@Req() req) {
    if (!req.user.is_admin) throw new ForbiddenException("Accès refusé");
    return this.testimonialsService.findAllForAdmin();
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard)
  updateStatus(@Param('id') id: string, @Body() updateDto: UpdateTestimonialDto, @Req() req) {
    if (!req.user.is_admin) throw new ForbiddenException("Accès refusé");
    return this.testimonialsService.updateStatus(+id, updateDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string, @Req() req) {
    if (!req.user.is_admin) throw new ForbiddenException("Accès refusé");
    return this.testimonialsService.remove(+id);
  }
}
