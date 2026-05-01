import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Tests E2E — routes publiques uniquement (pas de DB ni Firebase requis)
 * Pour les tests avec DB, utiliser une base de test dédiée via TEST_DATABASE_URL
 */
describe('ClefCloud API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health', () => {
    it('GET /api/health — retourne 200', () => {
      return request(app.getHttpServer()).get('/api/health').expect(200);
    });

    it('GET /api/health — retourne le statut et uptime', async () => {
      const res = await request(app.getHttpServer()).get('/api/health').expect(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('uptime');
    });
  });

  describe('Auth — routes protégées', () => {
    it('GET /api/auth/profile sans token — retourne 401', () => {
      return request(app.getHttpServer()).get('/api/auth/profile').expect(401);
    });

    it('PUT /api/auth/profile sans token — retourne 401', () => {
      return request(app.getHttpServer()).put('/api/auth/profile').send({ name: 'Test' }).expect(401);
    });

    it('DELETE /api/auth/profile sans token — retourne 401', () => {
      return request(app.getHttpServer()).delete('/api/auth/profile').expect(401);
    });
  });

  describe('Partitions — routes protégées', () => {
    it('GET /api/partitions sans token — retourne 401', () => {
      return request(app.getHttpServer()).get('/api/partitions').expect(401);
    });

    it('POST /api/partitions sans token — retourne 401', () => {
      return request(app.getHttpServer()).post('/api/partitions').expect(401);
    });

    it('GET /api/partitions/:id sans token — retourne 401', () => {
      return request(app.getHttpServer()).get('/api/partitions/1').expect(401);
    });

    it('GET /api/partitions/:id/download sans token — retourne 401', () => {
      return request(app.getHttpServer()).get('/api/partitions/1/download').expect(401);
    });
  });

  describe('Payments — routes protégées', () => {
    it('POST /api/payments/checkout/partition sans token — retourne 401', () => {
      return request(app.getHttpServer())
        .post('/api/payments/checkout/partition')
        .send({ partitionId: 1 })
        .expect(401);
    });

    it('POST /api/payments/checkout/premium sans token — retourne 401', () => {
      return request(app.getHttpServer()).post('/api/payments/checkout/premium').expect(401);
    });
  });

  describe('Auth — validate (public)', () => {
    it('POST /api/auth/validate sans token — retourne 401 (token invalide)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/validate')
        .send({ token: 'invalid-token' })
        .expect(401);
    });

    it('POST /api/auth/validate sans body — retourne 401', () => {
      return request(app.getHttpServer()).post('/api/auth/validate').send({}).expect(401);
    });
  });
});
