import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { FirebaseService } from '../firebase/firebase.service';
import { MailService } from '../mail.service';

const mockUserRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockFirebaseService = {
  verifyIdToken: jest.fn(),
};

const mockMailService = {
  sendWelcomeEmail: jest.fn(),
};

const mockUsersService = {
  getProfileStats: jest.fn(),
  update: jest.fn(),
  deleteUser: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: FirebaseService, useValue: mockFirebaseService },
        { provide: MailService, useValue: mockMailService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('validateFirebaseUser', () => {
    it('crée un nouvel utilisateur si inexistant', async () => {
      const decodedToken = { uid: 'firebase-uid-123', email: 'test@example.com', name: 'Test User', picture: null };
      const newUser = { id: 1, firebase_uid: 'firebase-uid-123', email: 'test@example.com' } as User;

      mockFirebaseService.verifyIdToken.mockResolvedValue(decodedToken);
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(newUser);
      mockUserRepository.save.mockResolvedValue(newUser);

      const result = await service.validateFirebaseUser('valid-token');

      expect(mockFirebaseService.verifyIdToken).toHaveBeenCalledWith('valid-token');
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ firebase_uid: 'firebase-uid-123', email: 'test@example.com' }),
      );
      expect(mockMailService.sendWelcomeEmail).toHaveBeenCalledWith(newUser);
      expect(result).toEqual(newUser);
    });

    it('met à jour last_login si utilisateur existant', async () => {
      const decodedToken = { uid: 'firebase-uid-123', email: 'test@example.com', name: 'Test', picture: null };
      const existingUser = { id: 1, firebase_uid: 'firebase-uid-123', email: 'test@example.com', last_login: null } as unknown as User;

      mockFirebaseService.verifyIdToken.mockResolvedValue(decodedToken);
      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue(existingUser);

      await service.validateFirebaseUser('valid-token');

      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockMailService.sendWelcomeEmail).not.toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('lève UnauthorizedException si token invalide', async () => {
      mockFirebaseService.verifyIdToken.mockRejectedValue(new Error('Token invalide'));

      await expect(service.validateFirebaseUser('bad-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('updateProfile', () => {
    it('délègue la mise à jour au UsersService', async () => {
      const user = { id: 1 } as User;
      mockUsersService.update.mockResolvedValue({ id: 1, name: 'Nouveau Nom' });

      await service.updateProfile(user, { name: 'Nouveau Nom' });

      expect(mockUsersService.update).toHaveBeenCalledWith(1, { name: 'Nouveau Nom' });
    });
  });

  describe('deleteAccount', () => {
    it('délègue la suppression au UsersService', async () => {
      const user = { id: 1 } as User;
      mockUsersService.deleteUser.mockResolvedValue({ success: true });

      const result = await service.deleteAccount(user);

      expect(mockUsersService.deleteUser).toHaveBeenCalledWith(1);
      expect(result).toEqual({ success: true });
    });
  });
});
