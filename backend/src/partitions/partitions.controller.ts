import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { PartitionsService } from './partitions.service';
import { CreatePartitionDto } from './dto/create-partition.dto';
import { QueryPartitionDto } from './dto/query-partition.dto';
import { CognitoJwtAuthGuard } from '../auth/guards/cognito-jwt-auth.guard';
import { CurrentUser, CognitoUser } from '../auth/decorators';
import { Public } from '../auth/decorators';

@ApiTags('partitions')
@Controller('partitions')
export class PartitionsController {
  constructor(private readonly partitionsService: PartitionsService) {}

  @Post('upload')
  @UseGuards(CognitoJwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload une nouvelle partition' })
  @ApiResponse({ status: 201, description: 'Partition créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async upload(
    @Body() createPartitionDto: CreatePartitionDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Vérifier le type de fichier
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only PDF, PNG, and JPG are allowed.');
    }

    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File too large. Maximum size is 10MB.');
    }

    // req.user vient du JWT guard et contient userId (Cognito sub)
    // On doit récupérer l'ID de la DB à partir du Cognito sub
    const cognitoSub = req.user.userId;
    return this.partitionsService.createFromCognitoSub(createPartitionDto, file, cognitoSub);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les partitions avec filtres' })
  @ApiResponse({ status: 200, description: 'Liste des partitions' })
  async findAll(@Query() queryDto: QueryPartitionDto) {
    return this.partitionsService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une partition par ID' })
  @ApiResponse({ status: 200, description: 'Partition trouvée' })
  @ApiResponse({ status: 404, description: 'Partition non trouvée' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.partitionsService.findOne(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Générer une URL signée pour télécharger une partition' })
  @ApiResponse({ status: 200, description: 'URL de téléchargement générée' })
  @ApiResponse({ status: 404, description: 'Partition non trouvée' })
  async getDownloadUrl(@Param('id', ParseIntPipe) id: number) {
    return this.partitionsService.getDownloadUrl(id);
  }

  @Delete(':id')
  @UseGuards(CognitoJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer une partition' })
  @ApiResponse({ status: 200, description: 'Partition supprimée avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Partition non trouvée' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.partitionsService.remove(id, req.user.id);
  }

  // ========== FAVORIS ==========

  @Post(':id/favorite')
  @UseGuards(CognitoJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ajouter une partition aux favoris' })
  @ApiResponse({ status: 201, description: 'Partition ajoutée aux favoris' })
  @ApiResponse({ status: 409, description: 'Déjà en favoris' })
  async addToFavorites(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.partitionsService.addToFavorites(id, req.user.id);
  }

  @Delete(':id/favorite')
  @UseGuards(CognitoJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retirer une partition des favoris' })
  @ApiResponse({ status: 200, description: 'Partition retirée des favoris' })
  @ApiResponse({ status: 404, description: 'Favori non trouvé' })
  async removeFromFavorites(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.partitionsService.removeFromFavorites(id, req.user.id);
  }

  @Get('favorites/list')
  @UseGuards(CognitoJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les partitions favorites de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Liste des favoris' })
  async getFavorites(
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
    @Request() req,
  ) {
    return this.partitionsService.getFavorites(req.user.id, limit, offset);
  }

  // ========== STATISTIQUES ==========

  @Get('stats/popular')
  @Public()
  @ApiOperation({ summary: 'Récupérer les partitions les plus populaires' })
  @ApiResponse({ status: 200, description: 'Partitions populaires' })
  async getPopularPartitions(@Query('limit') limit: number = 10) {
    return this.partitionsService.getPopularPartitions(limit);
  }

  @Get('stats/user')
  @UseGuards(CognitoJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les statistiques de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Statistiques utilisateur' })
  async getUserStats(@Request() req) {
    return this.partitionsService.getStats(req.user.id);
  }
}
