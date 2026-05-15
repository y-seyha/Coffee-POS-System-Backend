import { PartialType } from '@nestjs/swagger';
import {CreateVariantOptionDto} from "./create_variant_option.dto";


export class UpdateVariantOptionDto extends PartialType(
    CreateVariantOptionDto,
) {}