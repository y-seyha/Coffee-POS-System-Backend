import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './app.controller';
import { CategoryService } from './category/category.service';

describe('AppController (actually CategoryController)', () => {
  let controller: CategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: CategoryService,
          useValue: { findAll: jest.fn() },
        }
      ],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
