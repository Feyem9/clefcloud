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
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

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
      { name: 'cover', maxCount: 1 },
    ]),
  )
  async create(
    @Body() createPartitionDto: CreatePartitionDto,
    @UploadedFiles()
    files: {
      pdf?: Express.Multer.File[];
      audio?: Express.Multer.File[];
      cover?: Express.Multer.File[];
    },
    @Req() req: RequestWithUser,
  ) {
    return this.partitionsService.create(createPartitionDto, req.user, files);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les partitions (avec filtres et pagination)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'messePart', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async findAll(
    @Req() req: RequestWithUser,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('messePart') messePart?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.partitionsService.findAll(
      req.user,
      search,
      category,
      messePart,
      limit ? Math.min(parseInt(limit), 100) : 50,
      offset ? parseInt(offset) : 0,
    );
  }

  @Get('favorites')
  @ApiOperation({ summary: "Récupérer les favoris de l'utilisateur" })
  async findFavorites(@Req() req: RequestWithUser) {
    return this.partitionsService.findFavorites(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une partition par ID' })
  async findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.partitionsService.findOne(+id, req.user);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Obtenir une URL signée temporaire (15 min) pour télécharger le PDF' })
  async getDownloadUrl(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.partitionsService.getDownloadUrl(+id, req.user);
  }

  @Get(':id/audio')
  @ApiOperation({ summary: "Obtenir une URL signée temporaire (1h) pour écouter l'audio" })
  async getAudioUrl(@Param('id') id: string) {
    return this.partitionsService.getAudioUrl(+id);
  }

  @Post(':id/favorite')
  @ApiOperation({ summary: 'Ajouter/Retirer des favoris' })
  async toggleFavorite(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.partitionsService.toggleFavorite(+id, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une partition' })
  async remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.partitionsService.remove(+id, req.user);
  }
}
