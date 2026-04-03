import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Testimonial } from './entities/testimonial.entity';
import { CreateTestimonialDto, UpdateTestimonialDto } from './dto/testimonial.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TestimonialsService {
  constructor(
    @InjectRepository(Testimonial)
    private testimonialsRepository: Repository<Testimonial>,
  ) {}

  async create(createTestimonialDto: CreateTestimonialDto, user: User) {
    const testimonial = this.testimonialsRepository.create({
      ...createTestimonialDto,
      user_id: user.id,
      is_published: false,
    });
    return this.testimonialsRepository.save(testimonial);
  }

  async findAllPublished() {
    return this.testimonialsRepository.find({
      where: { is_published: true },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async findAllForAdmin() {
    return this.testimonialsRepository.find({
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async updateStatus(id: number, updateDto: UpdateTestimonialDto) {
    const testimonial = await this.testimonialsRepository.findOneBy({ id });
    if (!testimonial) {
      throw new NotFoundException('Testimonial non trouvé');
    }
    testimonial.is_published = updateDto.is_published;
    return this.testimonialsRepository.save(testimonial);
  }

  async remove(id: number) {
    const testimonial = await this.testimonialsRepository.findOneBy({ id });
    if (!testimonial) {
      throw new NotFoundException('Testimonial non trouvé');
    }
    return this.testimonialsRepository.remove(testimonial);
  }
}
