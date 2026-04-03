import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { SiteContent } from './entities/site-content.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SiteContent])],
  providers: [ContentService],
  controllers: [ContentController]
})
export class ContentModule {}
