import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestimonialsService } from './testimonials.service';
import { TestimonialsController } from './testimonials.controller';
import { Testimonial } from './entities/testimonial.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Testimonial])],
  providers: [TestimonialsService],
  controllers: [TestimonialsController]
})
export class TestimonialsModule {}
