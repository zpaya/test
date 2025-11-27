export interface OrderParams {
    transactionType: string;
    exchangeSegment: string;
    productType: string;
    orderType: string;
    securityId: string;
    tradingSymbol: string;
    quantity: number;
    price?: number;
    triggerPrice?: number;
    validity?: string;
    disclosedQuantity?: string;
    correlationId?: string;
}

export interface OrderResponse {
    success: boolean;
    orderId: string;
    orderStatus: string;
    broker: string;
    timestamp: string;
    details: any;
}

export interface OrderModificationParams {
    orderType: string;
    legName?: string;
    quantity?: number;
    price?: number;
    disclosedQuantity?: string;
    triggerPrice?: number;
    validity?: string;
}

export class DhanBroker {
    private baseUrl: string;
    private clientId: string;
    private accessToken: string;

    constructor(clientId: string, accessToken: string) {
        this.baseUrl = 'https://api.dhan.co/v2';
        this.clientId = clientId;
        this.accessToken = accessToken;
    }

    async placeOrder(orderParams: OrderParams): Promise<OrderResponse> {
        const {
            transactionType,
            exchangeSegment,
            productType,
            orderType,
            securityId,
            tradingSymbol,
            quantity,
            price,
            triggerPrice,
            validity = 'DAY',
            disclosedQuantity = '',
            correlationId = `STKSYNC_${Date.now()}`
        } = orderParams;

        const requestBody = {
            dhanClientId: this.clientId,
            correlationId,
            transactionType,
            exchangeSegment,
            productType,
            orderType,
            validity,
            securityId,
            quantity: quantity.toString(),
            disclosedQuantity,
            price: price ? price.toString() : '',
            triggerPrice: triggerPrice ? triggerPrice.toString() : '',
            afterMarketOrder: false,
            amoTime: '',
            boProfitValue: '',
            boStopLossValue: ''
        };

        const response = await fetch(`${this.baseUrl}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access-token': this.accessToken
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Order placement failed: ${response.status}`);
        }

        return {
            success: true,
            orderId: data.orderId,
            orderStatus: data.orderStatus,
            broker: 'Dhan',
            timestamp: new Date().toISOString(),
            details: data
        };
    }

    async getOrderStatus(orderId: string): Promise<any> {
        const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'access-token': this.accessToken
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch order status');
        }

        return data;
    }

    async getHoldings(): Promise<any> {
        const response = await fetch(`${this.baseUrl}/holdings`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'access-token': this.accessToken
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch holdings');
        }

        return data;
    }

    async getFunds(): Promise<any> {
        const response = await fetch(`${this.baseUrl}/fundlimit`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'access-token': this.accessToken
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch funds');
        }

        return data;
    }

    async getPositions(): Promise<any> {
        const response = await fetch(`${this.baseUrl}/positions`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'access-token': this.accessToken
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch positions');
        }

        return data;
    }

    async cancelOrder(orderId: string): Promise<any> {
        const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'access-token': this.accessToken
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to cancel order');
        }

        return data;
    }

    async modifyOrder(orderId: string, modifications: OrderModificationParams): Promise<any> {
        const {
            orderType,
            legName,
            quantity,
            price,
            disclosedQuantity,
            triggerPrice,
            validity
        } = modifications;

        const requestBody = {
            dhanClientId: this.clientId,
            orderId,
            orderType,
            legName: legName || '',
            quantity: quantity ? quantity.toString() : '',
            price: price ? price.toString() : '',
            disclosedQuantity: disclosedQuantity || '',
            triggerPrice: triggerPrice ? triggerPrice.toString() : '',
            validity: validity || 'DAY'
        };

        const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'access-token': this.accessToken
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to modify order');
        }

        return data;
    }
}

export const DHAN_CONSTANTS = {
    EXCHANGE_SEGMENTS: {
        NSE_EQ: 'NSE_EQ',
        NSE_FNO: 'NSE_FNO',
        BSE_EQ: 'BSE_EQ',
        BSE_FNO: 'BSE_FNO',
        MCX_COMM: 'MCX_COMM',
        BSE_CURR: 'BSE_CURR',
        NSE_CURR: 'NSE_CURR'
    },

    TRANSACTION_TYPES: {
        BUY: 'BUY',
        SELL: 'SELL'
    },

    PRODUCT_TYPES: {
        CNC: 'CNC',
        INTRADAY: 'INTRADAY',
        MARGIN: 'MARGIN',
        MTF: 'MTF',
        CO: 'CO',
        BO: 'BO'
    },

    ORDER_TYPES: {
        LIMIT: 'LIMIT',
        MARKET: 'MARKET',
        STOP_LOSS: 'STOP_LOSS',
        STOP_LOSS_MARKET: 'STOP_LOSS_MARKET'
    },

    VALIDITY: {
        DAY: 'DAY',
        IOC: 'IOC'
    },

    ORDER_STATUS: {
        PENDING: 'PENDING',
        REJECTED: 'REJECTED',
        CANCELLED: 'CANCELLED',
        TRADED: 'TRADED',
        EXPIRED: 'EXPIRED'
    }
};

export function mapProductTypeToDhan(productType: string): string {
    const mapping: Record<string, string> = {
        'CNC': DHAN_CONSTANTS.PRODUCT_TYPES.CNC,
        'MIS': DHAN_CONSTANTS.PRODUCT_TYPES.INTRADAY,
        'DELIVERY': DHAN_CONSTANTS.PRODUCT_TYPES.CNC,
        'INTRADAY': DHAN_CONSTANTS.PRODUCT_TYPES.INTRADAY
    };
    return mapping[productType] || DHAN_CONSTANTS.PRODUCT_TYPES.CNC;
}

export function mapExchangeSegment(exchange: string): string {
    const mapping: Record<string, string> = {
        'NSE': DHAN_CONSTANTS.EXCHANGE_SEGMENTS.NSE_EQ,
        'BSE': DHAN_CONSTANTS.EXCHANGE_SEGMENTS.BSE_EQ
    };
    return mapping[exchange] || DHAN_CONSTANTS.EXCHANGE_SEGMENTS.NSE_EQ;
}
