export interface BrokerConnection {
    id: string;
    brokerName: string;
    apiKey?: string;
    apiSecret?: string;
    clientId?: string;
    accessToken?: string;
    status: 'connected' | 'error';
    error?: string;
    connectedAt?: Date | string;
    verified?: boolean;
    verifiedAt?: Date | string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user';
    subscriptionStatus: 'active' | 'inactive';
    maxCapital?: number;
    brokerConnections?: BrokerConnection[];
    token?: string;
}

export interface Stock {
    symbol: string;
    securityId: string;
    name: string;
    price: number;
    exchange: string;
}

export interface OrderExecution {
    id: string;
    executionId: string;
    userId: string;
    userEmail: string;
    symbol: string;
    transactionType: 'BUY' | 'SELL';
    orderType: 'MARKET' | 'LIMIT';
    productType: string;
    requestedQuantity: number;
    executedQuantity: number;
    price: number;
    status: 'SUCCESS' | 'FAILED';
    errorReason?: string;
    timestamp: string | Date;
    orderDetails?: any;
}

export interface Holding {
    symbol: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    totalValue: number;
}

export interface Funds {
    availablecash: number;
    collateral: number;
    intraday: number;
    total: number;
}
