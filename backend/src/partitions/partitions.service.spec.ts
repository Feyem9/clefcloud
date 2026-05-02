import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PartitionsService } from './partitions.service';
import { Partition } from './entities/partition.entity';
import { Favorite } from './entities/favorite.entity';
import { UserPartition } from '../users/entities/user-partition.entity';
import { R2Service } from '../r2/r2.service';
import { User } from '../users/entities/user.entity';

const mockPartitionRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  remove: jest.fn(),
  increment: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockFavoriteRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
};

const mockUserPartitionRepository = {
  findOneBy: jest.fn(),
};

const mockR2Service = {
  uploadFile: jest.fn(),
  getPresignedUrl: jest.fn(),
  deleteFile: jest.fn(),
};

const mockUser = (overrides: Partial<User> = {}): User =>
  ({ id: 1, email: 'test@example.com', is_premium: false, premium_until: null, ...overrides } as User);

const mockPartition = (overrides = {}): Partition =>
  ({
    id: 42,
    title: 'Ave Maria',
    category: 'messe',
    price: 1000,
    created_by: 1,
    storage_path: 'partitions/1/42/partition.pdf',
    audio_storage_path: null,
    audio_url: null,
    download_url: null,
    is_active: true,
    ...overrides,
  } as Partition);

describe('PartitionsService', () => {
  let service: PartitionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartitionsService,
        { provide: getRepositoryToken(Partition), useValue: mockPartitionRepository },
        { provide: getRepositoryToken(Favorite), useValue: mockFavoriteRepository },
        { provide: getRepositoryToken(UserPartition), useValue: mockUserPartitionRepository },
        { provide: R2Service, useValue: mockR2Service },
      ],
    }).compile();

    service = module.get<PartitionsService>(PartitionsService);
    jest.clearAllMocks();
  });

  describe('findOne — contrôle d\'accès', () => {
    it('retourne hasAccess=true pour l\'auteur', async () => {
      const user = mockUser({ id: 1 });
      const partition = mockPartition({ created_by: 1 });

      mockPartitionRepository.findOne.mockResolvedValue(partition);
      mockFavoriteRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findOne(42, user);

      expect(result.hasAccess).toBe(true);
    });

    it('retourne hasAccess=false pour un utilisateur sans accès', async () => {
      const user = mockUser({ id: 99 });
      const partition = mockPartition({ created_by: 1 });

      mockPartitionRepository.findOne.mockResolvedValue(partition);
      mockUserPartitionRepository.findOneBy.mockResolvedValue(null);
      mockFavoriteRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findOne(42, user);

      expect(result.hasAccess).toBe(false);
      expect(result.storage_path).toBeNull();
      expect(result.download_url).toBeNull();
    });

    it('retourne hasAccess=true pour un utilisateur premium actif', async () => {
      const futureDate = new Date(Date.now() + 86400000);
      const user = mockUser({ id: 99, is_premium: true, premium_until: futureDate });
      const partition = mockPartition({ created_by: 1 });

      mockPartitionRepository.findOne.mockResolvedValue(partition);
      mockFavoriteRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findOne(42, user);

      expect(result.hasAccess).toBe(true);
    });

    it('retourne hasAccess=true pour un acheteur', async () => {
      const user = mockUser({ id: 99 });
      const partition = mockPartition({ created_by: 1 });

      mockPartitionRepository.findOne.mockResolvedValue(partition);
      mockUserPartitionRepository.findOneBy.mockResolvedValue({ id: 1, user_id: 99, partition_id: 42 });
      mockFavoriteRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findOne(42, user);

      expect(result.hasAccess).toBe(true);
    });

    it('lève NotFoundException si partition inexistante', async () => {
      mockPartitionRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, mockUser())).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDownloadUrl', () => {
    it('génère une URL signée pour l\'auteur', async () => {
      const user = mockUser({ id: 1 });
      const partition = mockPartition({ created_by: 1 });

      mockPartitionRepository.findOneBy.mockResolvedValue(partition);
      mockPartitionRepository.increment.mockResolvedValue(undefined);

      // Mock r2Service via le service
      const r2Service = (service as any).r2Service;
      r2Service.getPresignedUrl = jest.fn().mockResolvedValue('https://signed-url.example.com/file');

      const result = await service.getDownloadUrl(42, user);

      expect(result.url).toBeDefined();
    });

    it('lève ForbiddenException pour un utilisateur sans accès', async () => {
      const user = mockUser({ id: 99 });
      const partition = mockPartition({ created_by: 1 });

      mockPartitionRepository.findOneBy.mockResolvedValue(partition);
      mockUserPartitionRepository.findOneBy.mockResolvedValue(null);

      await expect(service.getDownloadUrl(42, user)).rejects.toThrow(ForbiddenException);
    });

    it('lève NotFoundException si pas de fichier storage_path', async () => {
      const user = mockUser({ id: 1 });
      const partition = mockPartition({ created_by: 1, storage_path: null });

      mockPartitionRepository.findOneBy.mockResolvedValue(partition);

      await expect(service.getDownloadUrl(42, user)).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleFavorite', () => {
    it('ajoute un favori si inexistant', async () => {
      const user = mockUser();
      mockFavoriteRepository.findOne.mockResolvedValue(null);
      mockFavoriteRepository.create.mockReturnValue({ user_id: 1, partition_id: 42 });
      mockFavoriteRepository.save.mockResolvedValue({});

      const result = await service.toggleFavorite(42, user);

      expect(result).toEqual({ isFavorite: true });
      expect(mockFavoriteRepository.save).toHaveBeenCalled();
    });

    it('supprime un favori si existant', async () => {
      const user = mockUser();
      const existingFav = { id: 1, user_id: 1, partition_id: 42 };
      mockFavoriteRepository.findOne.mockResolvedValue(existingFav);
      mockFavoriteRepository.remove.mockResolvedValue({});

      const result = await service.toggleFavorite(42, user);

      expect(result).toEqual({ isFavorite: false });
      expect(mockFavoriteRepository.remove).toHaveBeenCalledWith(existingFav);
    });
  });

  describe('remove', () => {
    it('lève ForbiddenException si l\'utilisateur n\'est pas l\'auteur', async () => {
      const user = mockUser({ id: 99 });
      const partition = mockPartition({ created_by: 1 });

      mockPartitionRepository.findOne.mockResolvedValue(partition);
      mockUserPartitionRepository.findOneBy.mockResolvedValue(null);
      mockFavoriteRepository.findOneBy.mockResolvedValue(null);

      await expect(service.remove(42, user)).rejects.toThrow(ForbiddenException);
    });
  });
});
