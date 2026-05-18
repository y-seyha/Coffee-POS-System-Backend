import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {EntityManager, In, Repository} from 'typeorm';

import { Cart } from '../common/entities/cart.entity';
import { CartItem } from '../common/entities/cart_items.entity';
import { Product } from '../common/entities/product.entity';

import { AddItemDto } from './dto/add-item.dto';
import { UpdateQuantityDto } from './dto/update-quantity.dto';
import { CartItemVariant } from '../common/entities/cart_item_variants.entity';
import {VariantOption} from "../common/entities/variant_options.entity";
import {Order, OrderStatus, OrderType} from "../common/entities/orders.entity";
import {OrderItem} from "../common/entities/order_items.entity";
import {OrderItemVariant} from "../common/entities/order_item_variants.entity";
import {OrderStatusHistory} from "../common/entities/order_status_history.entity";
import {CheckoutDto} from "./dto/checkout.dto";
import {Payment, PaymentMethod, PaymentStatus} from "../common/entities/payment.entity";

@Injectable()
export class CartService {
    private readonly logger = new Logger(CartService.name);

    constructor(
        @InjectRepository(Cart)
        private cartRepo: Repository<Cart>,

        @InjectRepository(CartItem)
        private cartItemRepo: Repository<CartItem>,

        @InjectRepository(Product)
        private productRepo: Repository<Product>,

        @InjectRepository(VariantOption)
        private variantOptionRepo: Repository<VariantOption>,

    ) {}

    async getOrCreateCart(staffId: number) {
        this.logger.log(`Get or create cart for staffId=${staffId}`);

        let cart = await this.cartRepo.findOne({
            where: { staff: { id: staffId } },
            relations: ['items', 'items.product', 'staff'],
        });

        if (!cart) {
            this.logger.log(`Cart not found. Creating new cart for staffId=${staffId}`);

            cart = this.cartRepo.create({
                staff: { id: staffId },
            });

            cart = await this.cartRepo.save(cart);

            this.logger.log(`New cart created: cartId=${cart.id}`);
        }

        return cart;
    }

    async updateQuantity(
        userId: number,
        itemId: number,
        dto: UpdateQuantityDto,
    ) {
        this.logger.log(
            `Update quantity: userId=${userId}, itemId=${itemId}, qty=${dto.quantity}`,
        );

        const item = await this.cartItemRepo.findOne({
            where: {
                id: itemId,
                cart: {
                    staff: { id: userId },
                },
            },
            relations: [
                'cart',
                'cart.staff',

                'product',
                'product.discount',

                'variants',
                'variants.variant_option',
            ],
        });

        if (!item) {
            this.logger.warn(`Cart item not found: itemId=${itemId}`);
            throw new NotFoundException('Item not found');
        }

        // prevent invalid quantity
        if (dto.quantity < 0) {
            throw new BadRequestException(
                'Quantity cannot be negative',
            );
        }

        // auto remove if quantity = 0
        if (dto.quantity === 0) {
            await this.cartItemRepo.remove(item);

            return {
                message: 'Item removed from cart',
            };
        }

        //recalculate
        const breakdown = this.buildPriceBreakdown({
            ...item,
            quantity: dto.quantity,
        } as CartItem);

        item.quantity = dto.quantity;

        item.unit_price =
            breakdown.unit_price.toString();

        item.total_price =
            breakdown.price_before_discount.toString();

        const updated = await this.cartItemRepo.save(item);

        return {
            message: 'Quantity updated successfully',
            data: updated,
        };
    }

    async addItem(staffId: number, dto: AddItemDto) {
        this.logger.log(`Add item: staff=${staffId}`);

        const cart = await this.getOrCreateCart(staffId);

        const product = await this.productRepo.findOneBy({
            id: dto.product_id,
        });

        if (!product) throw new NotFoundException('Product not found');

        const variantKey = this.buildVariantKey(dto.variants || []);

        // load existing items WITH variants
        const existingItems = await this.cartItemRepo.find({
            where: {
                cart_id: cart.id,
                product_id: dto.product_id,
            },
            relations: [
                'variants',
                'variants.variant_group',
                'variants.variant_option',
            ],
        });

        const existing = existingItems.find(item => {
            const existingKey = this.buildVariantKey(
                (item.variants || []).map(v => ({
                    variant_group_id: v.variant_group_id,
                    variant_option_id: v.variant_option_id,
                })),
            );

            return existingKey === variantKey;
        });

        if (existing) {
            const variantExtra = await this.calculateVariantPrice(
                dto.variants || []
            );

            const basePrice = Number(product.price) + variantExtra;

            existing.unit_price = basePrice.toString();
            existing.quantity += dto.quantity;
            existing.total_price = (
                basePrice * existing.quantity
            ).toString();

            await this.cartItemRepo.save(existing);

            const item = await this.findCartItemWithVariants(existing.id);

            return {
                message: 'Item updated in cart successfully',
                data: item,
            };
        }


        return this.cartRepo.manager.transaction(async (manager) => {
            const itemRepo = manager.getRepository(CartItem);
            const variantRepo = manager.getRepository(CartItemVariant);

            const variantExtra = await this.calculateVariantPrice(dto.variants || []);

            const basePrice = Number(product.price) + variantExtra;

            const item = itemRepo.create({
                cart_id: cart.id,
                product_id: product.id,
                name: product.name,
                unit_price: basePrice.toString(),
                quantity: dto.quantity,
                total_price: (basePrice * dto.quantity).toString(),
            });

            const saved = await itemRepo.save(item);

            if (dto.variants?.length) {
                const unique = new Map<string, any>();

                dto.variants.forEach(v => {
                    unique.set(
                        `${v.variant_group_id}-${v.variant_option_id}`,
                        v,
                    );
                });

                const cleanVariants = [...unique.values()];

                await variantRepo.save(
                    cleanVariants.map(v =>
                        variantRepo.create({
                            cart_item_id: saved.id,
                            variant_group_id: v.variant_group_id,
                            variant_option_id: v.variant_option_id,
                        }),
                    ),
                );
            }

            const result = await this.findCartItemWithVariants(saved.id);

            return {
                message: 'Item added to cart successfully',
                data: result,
            };
        });
    }

    async removeItem(userId: number, itemId: number) {
        this.logger.log(`Remove item: userId=${userId}, itemId=${itemId}`);

        const item = await this.cartItemRepo.findOne({
            where: {
                id: itemId,
                cart: {
                    staff: { id: userId },
                },
            },
            relations: ['cart', 'cart.staff'],
        });

        if (!item) {
            throw new NotFoundException('Item not found');
        }

        await this.cartItemRepo.remove(item);

        return { message: 'Item removed successfully' };
    }

    async clearCart(staffId: number) {
        const cart = await this.getOrCreateCart(staffId);

        const itemCount = await  this.cartItemRepo.count({
            where: {cart : {id : cart.id}}
        })

        if(itemCount === 0)
            return {message : 'Cart is already empty'}


        await this.cartItemRepo.delete({
            cart: { id: cart.id },
        });

        return {
            message: 'Cart cleared successfully',
            deleted_items: itemCount,
        };
    }

    async getCart(staffId: number) {
        this.logger.log(`Get cart: staffId=${staffId}`);

        const cart = await this.getOrCreateCart(staffId);

        const items = await this.cartItemRepo.find({
            where: { cart: { id: cart.id } },
            relations: [
                'product',
                'product.discount',
                'variants',
                'variants.variant_group',
                'variants.variant_option',
            ],
        });

        return this.normalizeCartResponse(cart, items);
    }


    async checkout(staffId: number, dto: CheckoutDto) {

        return this.cartRepo.manager.transaction(async (manager) => {
            const orderRepo = manager.getRepository(Order);
            const orderItemRepo = manager.getRepository(OrderItem);
            const orderItemVariantRepo =
                manager.getRepository(OrderItemVariant);

            const statusHistoryRepo =
                manager.getRepository(OrderStatusHistory);

            const paymentRepo = manager.getRepository(Payment);

            if (dto.order_type === OrderType.DINEIN && !dto.table_id) {
                throw new BadRequestException(
                    'table_id is required for DINEIN orders',
                );
            }

            if (dto.order_type !== OrderType.DINEIN && dto.table_id) {
                throw new BadRequestException(
                    'table_id only allowed for DINEIN',
                );
            }

           //load cart
            const cart = await manager.getRepository(Cart).findOne({
                where: {
                    staff: { id: staffId },
                },
                relations: [
                    'staff',

                    'items',
                    'items.product',

                    'items.variants',
                    'items.variants.variant_group',
                    'items.variants.variant_option',
                    'items.product.discount'
                ],
            });

            if (!cart || !cart.items.length) {
                throw new BadRequestException('Cart is empty');
            }

            //calculate total
            const { subtotal, discount, tax, grandTotal } =
                this.calculateCartSummary(cart);

            //create order
            const order = orderRepo.create({
                order_number: `ORD-${Date.now()}`,

                order_type: dto.order_type,

                table_id: dto.table_id,

                notes: dto.notes,

                staff_id: staffId,

                order_status:
                    dto.payment_method === PaymentMethod.CASH
                        ? OrderStatus.CONFIRMED
                        : OrderStatus.PENDING,

                subtotal,
                discount_amount: discount,
                tax_amount: tax,
                grand_total: grandTotal,
            });
            const savedOrder = await orderRepo.save(order);

            //create order items
            for (const item of cart.items) {

                const orderItem = orderItemRepo.create({
                    order: savedOrder,

                    product_id: item.product_id,

                    name: item.name,

                    unit_price: Number(item.unit_price),

                    quantity: item.quantity,

                    discount_amount: 0,

                    total_price: Number(item.total_price),
                });

                const savedOrderItem =
                    await orderItemRepo.save(orderItem);

                //save variant
                if (item.variants?.length) {

                    const variants = item.variants.map(v =>
                        orderItemVariantRepo.create({

                            orderItem: savedOrderItem,

                            variant_group_id: v.variant_group_id,

                            variant_option_id: v.variant_option_id,

                            variant_group_name:
                                v.variant_group?.name || '',

                            variant_option_name:
                                v.variant_option?.name || '',

                            price_adjustment: Number(
                                v.variant_option?.price_adjustment || 0
                            ),
                        }),
                    );

                    await orderItemVariantRepo.save(variants);
                }
            }

        //save in order status history
            await statusHistoryRepo.save({
                order: savedOrder,

                status:
                    dto.payment_method === PaymentMethod.CASH
                        ? OrderStatus.CONFIRMED
                        : OrderStatus.PENDING,

                notes: 'Order created',

                user: { id: staffId },
            });

            const isCashPayment =
                dto.payment_method === PaymentMethod.CASH;

            const payment = paymentRepo.create({
                payment_number: `PAY-${Date.now()}`,

                order: savedOrder,

                payment_method: dto.payment_method,

                payment_status: isCashPayment
                    ? PaymentStatus.PAID
                    : PaymentStatus.PENDING,

                amount: grandTotal,

                ...(isCashPayment && {
                    paid_at: new Date(),
                }),
            });

            const savedPayment = await paymentRepo.save(payment);


            //clear cart
            await manager.getRepository(CartItem).delete({
                cart: { id: cart.id },
            });

            return {
                message: 'Checkout completed successfully',

                order: {
                    id: savedOrder.id,
                    order_number: savedOrder.order_number,
                    status: savedOrder.order_status,

                    subtotal,
                    tax,
                    discount,
                    total: grandTotal,
                },

                payment: {
                    id: savedPayment.id,
                    payment_number: savedPayment.payment_number,
                    method: savedPayment.payment_method,
                    status: savedPayment.payment_status,
                    amount: Number(savedPayment.amount),
                },
            };
        });
    }

    async increaseQuantity(userId: number, itemId: number) {
        const item = await this.cartItemRepo.findOne({
            where: {
                id: itemId,
                cart: {
                    staff: { id: userId },
                },
            },
            relations: [
                'product',
                'product.discount',

                'variants',
                'variants.variant_option',
            ],
        });

        if (!item) {
            throw new NotFoundException('Item not found');
        }

        item.quantity += 1;

        const breakdown = this.buildPriceBreakdown(item);

        item.unit_price =
            breakdown.unit_price.toString();

        item.total_price =
            breakdown.price_before_discount.toString();

        return this.cartItemRepo.save(item);
    }

    async decreaseQuantity(userId: number, itemId: number) {
        const item = await this.cartItemRepo.findOne({
            where: {
                id: itemId,
                cart: {
                    staff: { id: userId },
                },
            },
            relations: [
                'product',
                'product.discount',

                'variants',
                'variants.variant_option',
            ],
        });

        if (!item) {
            throw new NotFoundException('Item not found');
        }

        // remove automatically if qty becomes 0
        if (item.quantity <= 1) {
            await this.cartItemRepo.remove(item);

            return {
                message: 'Item removed from cart',
            };
        }

        item.quantity -= 1;

        const breakdown = this.buildPriceBreakdown(item);

        item.unit_price =
            breakdown.unit_price.toString();

        item.total_price =
            breakdown.price_before_discount.toString();

        return this.cartItemRepo.save(item);
    }

    private buildVariantKey(
        variants: { variant_group_id: number; variant_option_id: number }[],
    ) {
        return (
            variants
                ?.map(v => `${v.variant_group_id}:${v.variant_option_id}`)
                .sort()
                .join('|') || 'no-variant'
        );
    }

    private async findCartItemWithVariants(itemId: number, manager?: EntityManager) {
        const repo = manager ? manager.getRepository(CartItem) : this.cartItemRepo;

        return repo.findOne({
            where: { id: itemId },
            relations: {
                product: true,
                variants: {
                    variant_group: true,
                    variant_option: true,
                },
            },
        });
    }

    private async calculateVariantPrice(
        variants: { variant_option_id: number }[],
    ) {
        if (!variants?.length) return 0;

        const options = await this.variantOptionRepo.find({
            where: {
                id: In(variants.map(v => v.variant_option_id)),
            },
        });

        let extra = 0;

        for (const opt of options) {
            const price = Number(opt.price_adjustment || 0);

            if (opt.price_adjustment_type === 'ADD') {
                extra += price;
            }

            // ***IMPORTANT*** Will implement
            //  SET should NOT add price normally
            // It usually means "replace base price rule"
            // so ignore it for now unless you design special logic
        }

        return extra;
    }

    private normalizeCartResponse(cart: Cart, items: CartItem[]) {
        const mappedItems = items.map(item => {
            const breakdown = this.buildPriceBreakdown(item);

            return {
                id: item.id,

                product: {
                    id: item.product?.id,
                    name: item.product?.name,
                    base_price: Number(item.product?.price),
                },

                unit_price: breakdown.unit_price,
                quantity: item.quantity,
                total_price: breakdown.price_before_discount,

                price_breakdown: breakdown,

                variants: item.variants.map(v => ({
                    group: v.variant_group?.name,
                    option: v.variant_option?.name,
                    price: Number(v.variant_option?.price_adjustment || 0),
                })),
            };
        });

        const subtotal = mappedItems.reduce(
            (s, i) => s + i.price_breakdown.price_before_discount,
            0,
        );

        const discount_total = mappedItems.reduce(
            (s, i) => s + i.price_breakdown.discount,
            0,
        );

        const grand_total = mappedItems.reduce(
            (s, i) => s + i.price_breakdown.final_price,
            0,
        );

        const quantity_total = mappedItems.reduce(
            (s, i) => s + i.quantity,
            0,
        );

        return {
            cart: {
                id: cart.id,
                staff: {
                    id: cart.staff?.id,
                    name: cart.staff?.name,
                    email: cart.staff?.email,
                },

                items: mappedItems,
            },

            summary: {
                items_count: mappedItems.length,
                quantity_total,
                subtotal,
                discount_total,
                grand_total,
                tax: 0,
            },
        };
    }

    private calculateItemDiscount(item: CartItem, price: number) {
        const d = item.product?.discount;

        if (!d || !d.is_active) return 0;

        const value = Number(d.value);

        if (d.type === 'PERCENTAGE') {
            return (price * value) / 100;
        }

        if (d.type === 'FIXED') {
            return value;
        }

        return 0;
    }
    private buildPriceBreakdown(item: CartItem) {
        const basePrice = Number(item.product?.price || 0);

        const addonPrice = (item.variants || []).reduce((sum, v) => {
            return sum + Number(v.variant_option?.price_adjustment || 0);
        }, 0);

        const unitPrice = basePrice + addonPrice;

        const quantity = item.quantity;

        const priceBeforeDiscount = unitPrice * quantity;

        const discount = this.calculateItemDiscount(item, priceBeforeDiscount);

        const finalPrice = priceBeforeDiscount - discount;

        return {
            base_price: basePrice,
            addon_price: addonPrice,
            unit_price: unitPrice,
            quantity,
            price_before_discount: priceBeforeDiscount,
            discount,
            final_price: finalPrice,
        };
    }

    private calculateCartSummary(cart: Cart) {
        const items = cart.items;

        const breakdowns = items.map(i => this.buildPriceBreakdown(i));

        const subtotal = breakdowns.reduce(
            (s, i) => s + i.price_before_discount,
            0,
        );

        const discount = breakdowns.reduce(
            (s, i) => s + i.discount,
            0,
        );

        const grandTotal = breakdowns.reduce(
            (s, i) => s + i.final_price,
            0,
        );

        return {
            subtotal,
            discount,
            tax: 0,
            grandTotal,
        };
    }
}