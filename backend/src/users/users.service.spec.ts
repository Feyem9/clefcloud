import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Partition } from '../partitions/entities/partition.entity';
import { Favorite } from '../partitions/entities/favorite.entity';
import { UserPartition } from './entities/user-partition.entity';

const mockUserRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  softDelete: jest.fn(),
};

const mockPartitionRepository = {
  find: jest.fn(),
  findAndCount: jest.fn(),
};

const mockFavoriteRepository = {
  count: jest.fn(),
};

const mockUserPartitionRepository = {
  find: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Partition), useValue: mockPartitionRepository },
        { provide: getRepositoryToken(Favorite), useValue: mockFavoriteRepository },
        { provide: getRepositoryToken(UserPartition), useValue: mockUserPartitionRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('retourne l\'utilisateur si trouvé', async () => {
      const user = { id: 1, email: 'test@example.com', name: 'Test' } as User;
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findOne(1);

      expect(result).toEqual(user);
    });

    it('lève NotFoundException si utilisateur inexistant', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('met à jour le nom de l\'utilisateur', async () => {
      const user = { id: 1, email: 'test@example.com', name: 'Ancien Nom', updated_at: new Date() } as User;
      const updatedUser = { ...user, name: 'Nouveau Nom' };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(1, 'Nouveau Nom');

      expect(result.name).toBe('Nouveau Nom');
      expect(mockUserRepository.save).toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('effectue un soft delete', async () => {
      const user = { id: 1 } as User;
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.softDelete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteUser(1);

      expect(mockUserRepository.softDelete).toHaveBeenCalledWith(1);
      expect(result).toEqual({ success: true });
    });
  });

  describe('getProfileStats', () => {
    it('retourne les statistiques correctes', async () => {
      const user = { id: 1 } as User;
      const partitions = [
        { download_count: 5, view_count: 10 },
        { download_count: 3, view_count: 7 },
      ] as Partition[];

      mockPartitionRepository.find.mockResolvedValue(partitions);
      mockFavoriteRepository.count.mockResolvedValue(4);
      mockUserPartitionRepository.find.mockResolvedValue([]);

      const result = await service.getProfileStats(user);

      expect(result.totalPartitions).toBe(2);
      expect(result.totalDownloads).toBe(8);
      expect(result.totalViews).toBe(17);
      expect(result.totalFavorites).toBe(4);
    });
  });
});
