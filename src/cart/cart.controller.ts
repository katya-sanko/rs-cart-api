import { Controller, Get, Delete, Put, Body, Req, Post, HttpStatus } from '@nestjs/common';
import { QueryResult } from 'pg';
import { dbClient } from '../shared/db-client';
import { OrderService } from '../order';
import { AppRequest, getUserIdFromRequest } from '../shared';
import { calculateCartTotal } from './models-rules';
import { CartService } from './services'; // temporary not used and logic put directly in controller for testing purposes

@Controller('api/profile/cart')
export class CartController {
	constructor(private cartService: CartService, private orderService: OrderService) { }

	@Get(':cartid')
	async findUserCart(@Req() req: AppRequest) {
		try {
			const cart: QueryResult = await dbClient(`SELECT * FROM CARTS WHERE ID='${req.params.cartid}';`);

			if (cart?.rowCount > 0) {
				const items = await dbClient(`SELECT * FROM CART_ITEMS WHERE CART_ID='${cart.rows[0].id}';`);

				return {
					statusCode: HttpStatus.OK,
					message: 'OK',
					data: {
						cart: { ...cart.rows[0], items: items.rows[0] || [] },
					},
				};
			} else {
				return {
					statusCode: HttpStatus.NOT_FOUND,
					message: `Requested data with id:  ${req.params.cartid} not found`,
					data: {},
				};
			}
		} catch (err) {
			console.log(`findUserCart: error: ${err}`);
			return {
				statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
				message: 'Internal Server error :(',
				data: {},
			};
		}
	}

	// @UseGuards(JwtAuthGuard)
	// @UseGuards(BasicAuthGuard)
	@Put()
	async updateUserCart(@Req() req: AppRequest, @Body() body) {
		console.log(body);
		try {
			const cartItems = await dbClient(`SELECT * FROM CART_ITEMS WHERE CART_ID='${body.cartId}';`);
			let output;
			let updatedItems = [];
			console.log(JSON.stringify(cartItems));

			if (cartItems?.rowCount > 0) {
				const prevItems = cartItems.rows;
				if (prevItems.find(i => i.product_id=== body.product.id)) {
					updatedItems = prevItems.map(item => {
						if (item.product_id === body.product.id) {
							item.count += 1;
							return item;
						}
						return item;
					});
				} else {
					if (Array.isArray(prevItems)) {
						updatedItems.push(body.product);
					}
				}

				output = await dbClient(`UPDATE CART_ITEMS SET COUNT='${updatedItems[0].count}' WHERE CART_ID='${body.cartId}'`);
			} else {
				output = await dbClient(`INSERT INTO CART_ITEMS (COUNT, CART_ID) VALUES ('${JSON.stringify([
						{
							...body.product,
							count: body.count,
						},
					])}', '${body.cartId}');`
				);
			}

			return {
				statusCode: HttpStatus.OK,
				message: `Updated data for ${body.cartId}`,
				data: {
					message: `Update ${body.cartId} : ${output}`,
				},
			};
		} catch (err) {
			console.log(`updateUserCart: error: ${err}`);
			return {
				statusCode: HttpStatus.BAD_REQUEST,
				message: `updateUserCart product id: ${body.product.id} error occurred`,
				err,
			};
		}
	}

	// @UseGuards(JwtAuthGuard)
	// @UseGuards(BasicAuthGuard)
	@Delete(':cartid')
	async clearUserCart(@Req() req: AppRequest) {
		try {
			const cart: QueryResult = await dbClient(`SELECT * FROM CARTS WHERE ID='${req.params.cartid}';`);

			if (cart?.rowCount > 0) {
				const deletedCartItems = await dbClient(`DELETE FROM CART_ITEMS WHERE CART_ID='${cart.rows[0].id}';`);
				const deletedCart = await dbClient(`DELETE FROM CARTs WHERE ID='${cart.rows[0].id}';`);

				return {
					statusCode: HttpStatus.OK,
					message: 'OK',
					data: {
						cart: { ...deletedCartItems, ...deletedCart },
					},
				};
			} else {
				return {
					statusCode: HttpStatus.NOT_FOUND,
					message: `Requested data with id:  ${req.params.cartid} not found`,
					data: {},
				};
			}
		} catch (err) {
			console.log(`clearUserCart: error: ${err}`);
			return {
				statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
				message: 'Internal Server error :(',
				data: {},
			};
		}
	}

	// @UseGuards(JwtAuthGuard)
	// @UseGuards(BasicAuthGuard)
	@Post('checkout')
	checkout(@Req() req: AppRequest, @Body() body) {
		const userId = getUserIdFromRequest(req);
		const cart = this.cartService.findByUserId(userId);

		if (!(cart?.items.length)) {
			const statusCode = HttpStatus.BAD_REQUEST;
			req.statusCode = statusCode

			return {
				statusCode,
				message: 'OK',
			}
		}

		const { id: cartId, items } = cart;
		const total = calculateCartTotal(cart);
		const order = this.orderService.create({
			...body, // TODO: validate and pick only necessary data
			userId,
			cartId,
			items,
			total,
		});
		this.cartService.removeByUserId(userId);

		return {
			statusCode: HttpStatus.OK,
			message: 'OK',
			data: { order }
		}
	}
}
