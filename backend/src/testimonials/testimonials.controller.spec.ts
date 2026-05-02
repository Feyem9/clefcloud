import { Test, TestingModule } from '@nestjs/testing';
import { TestimonialsController } from './testimonials.controller';
import { TestimonialsService } from './testimonials.service';

const mockTestimonialsService = {
  findAllPublished: jest.fn(),
  findAllForAdmin: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
  remove: jest.fn(),
};

describe('TestimonialsController', () => {
  let controller: TestimonialsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestimonialsController],
      providers: [
        { provide: TestimonialsService, useValue: mockTestimonialsService },
      ],
    }).compile();

    controller = module.get<TestimonialsController>(TestimonialsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
