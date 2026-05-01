import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { TestimonialsService } from './testimonials.service';
import { CreateTestimonialDto, UpdateTestimonialDto } from './dto/testimonial.dto';
import { AdminGuard } from '../common/guards/admin.guard';
import { Public } from '../common/decorators/public.decorator';

@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Post()
  create(@Body() createTestimonialDto: CreateTestimonialDto, @Req() req) {
    return this.testimonialsService.create(createTestimonialDto, req.user);
  }

  @Public()
  @Get()
  findAllPublished() {
    return this.testimonialsService.findAllPublished();
  }

  @Get('admin')
  @UseGuards(AdminGuard)
  findAllForAdmin() {
    return this.testimonialsService.findAllForAdmin();
  }

  @Patch(':id/status')
  @UseGuards(AdminGuard)
  updateStatus(@Param('id') id: string, @Body() updateDto: UpdateTestimonialDto) {
    return this.testimonialsService.updateStatus(+id, updateDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.testimonialsService.remove(+id);
  }
}
