import { Test, TestingModule } from '@nestjs/testing';
import { VariantManagementController } from './variant-management.controller';

describe('VariantManagementController', () => {
  let controller: VariantManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VariantManagementController],
    }).compile();

    controller = module.get<VariantManagementController>(VariantManagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
