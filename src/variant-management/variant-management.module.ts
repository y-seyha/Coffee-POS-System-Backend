import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { VariantGroupsController } from './variant-groups.controller';
import { VariantGroupsService } from './variant-groups.service';

import { VariantOptionsController } from './variant-options.controller';
import { VariantOptionsService } from './variant-options.service';
import {VariantGroup} from "../common/entities/variant_groups.entity";
import {VariantOption} from "../common/entities/variant_options.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VariantGroup,
      VariantOption,
    ]),
  ],
  controllers: [
    VariantGroupsController,
    VariantOptionsController,
  ],
  providers: [
    VariantGroupsService,
    VariantOptionsService,
  ],
  exports: [
    VariantGroupsService,
    VariantOptionsService,
  ],
})
export class VariantManagementModule {}