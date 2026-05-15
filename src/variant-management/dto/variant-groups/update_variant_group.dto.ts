import { PartialType } from '@nestjs/swagger';
import {CreateVariantGroupDto} from "./create_variant_group.dto";


export class UpdateVariantGroupDto extends PartialType(
    CreateVariantGroupDto,
) {}