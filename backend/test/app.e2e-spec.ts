import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET) - health check stub', () => {
    // Basic test to see if something responds or if we can define a health endpoint
    return request(app.getHttpServer())
      .get('/')
      .expect(404); // Expect 404 if no root defined, but verifying it bootstraps
  });
});
