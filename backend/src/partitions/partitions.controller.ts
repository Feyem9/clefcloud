import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  Req,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { PartitionsService } from './partitions.service';
import { CreatePartitionDto } from './dto/create-partition.dto';

@ApiTags('partitions')
@ApiBearerAuth()
@Controller('partitions')
export class PartitionsController {
  constructor(private readonly partitionsService: PartitionsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une partition avec PDF et Audio' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'pdf', maxCount: 1 },
      { name: 'audio', maxCount: 1 },
    ]),
  )
  async create(
    @Body() createPartitionDto: CreatePartitionDto,
    @UploadedFiles() files: { pdf?: Express.Multer.File[]; audio?: Express.Multer.File[] },
    @Req() req,
  ) {
    return this.partitionsService.create(createPartitionDto, req.user, files);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les partitions' })
  async findAll(@Req() req) {
    return this.partitionsService.findAll(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une partition par ID' })
  async findOne(@Param('id') id: string) {
    return this.partitionsService.findOne(+id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une partition' })
  async remove(@Param('id') id: string, @Req() req) {
    return this.partitionsService.remove(+id, req.user);
  }
}
