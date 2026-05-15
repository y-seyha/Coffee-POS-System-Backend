import { Test, TestingModule } from '@nestjs/testing';
import { VariantManagementService } from './variant-management.service';

describe('VariantManagementService', () => {
  let service: VariantManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VariantManagementService],
    }).compile();

    service = module.get<VariantManagementService>(VariantManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
