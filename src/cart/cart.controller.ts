import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    ParseIntPipe,
    Delete,
    Patch,
    UseGuards,
} from '@nestjs/common';

import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiParam,
} from '@nestjs/swagger';

import { CartService } from './cart.service';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateQuantityDto } from './dto/update-quantity.dto';


import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { CurrentUser } from '../auth/decorator/current_user.decorator';
import {CheckoutDto} from "./dto/checkout.dto";

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
    constructor(private readonly cartService: CartService) {}

    //tested
    @Get()
    @ApiOperation({ summary: 'Get current user cart' })
    @ApiResponse({ status: 200, description: 'Cart retrieved successfully' })
    getCart(@CurrentUser() user: any) {
        return this.cartService.getCart(user.id);
    }

    //tested
    @Post('addToCart')
    @ApiOperation({ summary: 'Add item to cart' })
    @ApiResponse({ status: 201, description: 'Item added to cart' })
    addItem(
        @CurrentUser() user: any,
        @Body() dto: AddItemDto,
    ) {
        return this.cartService.addItem(user.id, dto);
    }

    //tested
    @Patch('items/:id')
    @ApiOperation({ summary: 'Update cart item quantity' })
    @ApiParam({ name: 'id', type: Number, description: 'Cart item ID' })
    @ApiResponse({ status: 200, description: 'Quantity updated' })
    updateQuantity(
        @CurrentUser() user: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateQuantityDto,
    ) {
        return this.cartService.updateQuantity(user.id, id, dto);
    }

    //tested
    @Delete('items/:id')
    @ApiOperation({ summary: 'Remove item from cart' })
    @ApiParam({ name: 'id', type: Number })
    removeItem(
        @CurrentUser() user: any,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.cartService.removeItem(user.id, id);
    }

    //tested
    @Delete('clear')
    @ApiOperation({ summary: 'Clear entire cart' })
    clear(@CurrentUser() user: any) {
        return this.cartService.clearCart(user.id);
    }

    //tested
    @Post('checkout')
    @ApiOperation({ summary: 'Checkout cart and create order' })
    checkout(
        @CurrentUser() user: any,
        @Body() dto: CheckoutDto,
    ) {
        return this.cartService.checkout(user.id, dto);
    }
}