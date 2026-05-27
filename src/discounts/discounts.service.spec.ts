import { Test, TestingModule } from '@nestjs/testing';
import { DiscountsService } from './discounts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Discount } from '../common/entities/discount.entity';

describe('DiscountsService', () => {
  let service: DiscountsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountsService,
        {
          provide: getRepositoryToken(Discount),
          useValue: {},
        }
      ],
    }).compile();

    service = module.get<DiscountsService>(DiscountsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
