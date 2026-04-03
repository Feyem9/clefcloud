import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteContent } from './entities/site-content.entity';
import { UpdateSiteContentDto } from './dto/content.dto';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(SiteContent)
    private contentRepository: Repository<SiteContent>,
  ) {}

  async getSection(section: string) {
    const content = await this.contentRepository.findOneBy({ section });
    return content || { section, content: '' };
  }

  async updateSection(section: string, updateDto: UpdateSiteContentDto) {
    let content = await this.contentRepository.findOneBy({ section });
    if (!content) {
      content = this.contentRepository.create({ section, content: updateDto.content });
    } else {
      content.content = updateDto.content;
    }
    return this.contentRepository.save(content);
  }
}
