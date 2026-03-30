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
  Query,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Récupérer toutes les partitions (avec filtres)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'messePart', required: false })
  async findAll(
    @Req() req,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('messePart') messePart?: string,
  ) {
    return this.partitionsService.findAll(req.user, search, category, messePart);
  }

  @Get('favorites')
  @ApiOperation({ summary: 'Récupérer les favoris de l\'utilisateur' })
  async findFavorites(@Req() req) {
    return this.partitionsService.findFavorites(req.user);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Obtenir l\'URL de téléchargement d\'une partition' })
  async getDownloadUrl(@Param('id') id: string, @Req() req) {
    return this.partitionsService.getDownloadUrl(+id, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une partition par ID' })
  async findOne(@Param('id') id: string, @Req() req) {
    return this.partitionsService.findOne(+id, req.user);
  }

  @Post(':id/favorite')
  @ApiOperation({ summary: 'Ajouter/Retirer des favoris' })
  async toggleFavorite(@Param('id') id: string, @Req() req) {
    return this.partitionsService.toggleFavorite(+id, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une partition' })
  async remove(@Param('id') id: string, @Req() req) {
    return this.partitionsService.remove(+id, req.user);
  }
}
