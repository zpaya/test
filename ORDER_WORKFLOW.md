# StockSync Order Workflow with Dhan Integration

## Overview

This document explains the complete order workflow from admin order placement to execution across multiple user accounts using the Dhan broker API.

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         ADMIN PLACES ORDER                       │
│  Stock: RELIANCE | Type: BUY | Quantity: 10 | Order: MARKET     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SYSTEM FINDS ACTIVE SUBSCRIBERS                │
│              (subscriptionStatus === 'active')                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
┌───────────────────────────┐  ┌───────────────────────────┐
│      USER 1: JOHN         │  │      USER 2: JANE         │
│   Dhan Connected: YES     │  │   Dhan Connected: NO      │
│   Capital: ₹100,000       │  │   Capital: ₹100,000       │
└───────────┬───────────────┘  └───────────┬───────────────┘
            │                              │
            ▼                              ▼
┌───────────────────────────┐  ┌───────────────────────────┐
│  CALCULATE ORDER QTY      │  │  CALCULATE ORDER QTY      │
│  25% of Capital = ₹25,000 │  │  25% of Capital = ₹25,000 │
│  Stock Price = ₹2,950     │  │  Stock Price = ₹2,950     │
│  Max Qty = 8 shares       │  │  Max Qty = 8 shares       │
│  Order Qty = min(10,8)=8  │  │  Order Qty = min(10,8)=8  │
└───────────┬───────────────┘  └───────────┬───────────────┘
            │                              │
            ▼                              ▼
┌───────────────────────────┐  ┌───────────────────────────┐
│    PLACE REAL ORDER       │  │    PLACE MOCK ORDER       │
│    via Dhan API v2        │  │    (simulated)            │
│                           │  │                           │
│  POST /v2/orders          │  │  Mock Response:           │
│  {                        │  │  orderId: ORD12345        │
│    dhanClientId: "john",  │  │  status: EXECUTED         │
│    transactionType: "BUY",│  │                           │
│    exchangeSegment:"NSE_EQ│  │                           │
│    productType: "CNC",    │  │                           │
│    orderType: "MARKET",   │  │                           │
│    securityId: "2885",    │  │                           │
│    quantity: "8"          │  │                           │
│  }                        │  │                           │
└───────────┬───────────────┘  └───────────┬───────────────┘
            │                              │
            ▼                              ▼
┌───────────────────────────┐  ┌───────────────────────────┐
│    DHAN API RESPONSE      │  │    MOCK RESPONSE          │
│                           │  │                           │
│  {                        │  │  {                        │
│    orderId: "112233",     │  │    orderId: "ORD456",     │
│    orderStatus: "PENDING" │  │    status: "EXECUTED"     │
│  }                        │  │  }                        │
└───────────┬───────────────┘  └───────────┬───────────────┘
            │                              │
            ▼                              ▼
┌───────────────────────────┐  ┌───────────────────────────┐
│   LOG TO DATABASE         │  │   LOG TO DATABASE         │
│                           │  │                           │
│  order_executions {       │  │  order_executions {       │
│    userId: "john",        │  │    userId: "jane",        │
│    symbol: "RELIANCE",    │  │    symbol: "RELIANCE",    │
│    status: "SUCCESS",     │  │    status: "SUCCESS",     │
│    executedQuantity: 8,   │  │    executedQuantity: 8,   │
│    broker: "Dhan"         │  │    broker: "Mock"         │
│  }                        │  │  }                        │
└───────────┬───────────────┘  └───────────┬───────────────┘
            │                              │
            └────────────┬─────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      RETURN EXECUTION SUMMARY                    │
│                                                                  │
│  {                                                               │
│    executionId: "exec-123",                                     │
│    totalSubscribers: 2,                                         │
│    successfulExecutions: 2,                                     │
│    failedExecutions: 0,                                         │
│    results: [                                                   │
│      { userId: "john", status: "SUCCESS", quantity: 8 },       │
│      { userId: "jane", status: "SUCCESS", quantity: 8 }        │
│    ]                                                            │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

## Step-by-Step Process

### 1. Admin Order Placement

**Endpoint**: `POST /api/admin/execute-order`

**Request Body**:
```json
{
  "symbol": "RELIANCE",
  "transactionType": "BUY",
  "orderType": "MARKET",
  "quantity": 10,
  "productType": "CNC"
}
```

**Validations**:
- User must have admin role
- Stock symbol must be valid
- At least one active subscriber must exist

### 2. Find Active Subscribers

**Database Query**:
```javascript
db.users.find({
  subscriptionStatus: 'active',
  role: 'user'
})
```

**Result**: Array of user objects with broker connections and capital allocation

### 3. Per-User Processing

For each active subscriber, the system processes the order individually:

#### 3.1. Check Broker Connection

```javascript
const dhanConnection = subscriber.brokerConnections?.find(
  bc => bc.brokerName === 'Dhan' && bc.status === 'connected'
);

if (dhanConnection && dhanConnection.accessToken) {
  // Use real Dhan API
} else {
  // Use mock API
}
```

#### 3.2. Calculate Order Quantity

**For BUY Orders**:
```javascript
// Use 25% of max allocated capital
const capitalToUse = subscriber.maxCapital * 0.25;
const maxQuantityBuyable = Math.floor(capitalToUse / stock.price);
const orderQuantity = Math.min(requestedQuantity, maxQuantityBuyable);

if (orderQuantity === 0) {
  return {
    canExecute: false,
    errorReason: 'Insufficient funds'
  };
}
```

**For SELL Orders**:
```javascript
// Check if stock exists in portfolio
const holdings = await dhanBroker.getHoldings();
const holding = holdings.find(h => h.symbol === symbol);

if (!holding) {
  return {
    canExecute: false,
    errorReason: 'Stock not in portfolio'
  };
}

// Sell available quantity
const orderQuantity = Math.min(requestedQuantity, holding.quantity);
```

#### 3.3. Place Order

**Real Order via Dhan API**:
```javascript
const dhanBroker = new DhanBroker(clientId, accessToken);

const orderParams = {
  transactionType: 'BUY',
  exchangeSegment: 'NSE_EQ',
  productType: 'CNC',
  orderType: 'MARKET',
  securityId: '2885',
  tradingSymbol: 'RELIANCE',
  quantity: 8,
  validity: 'DAY'
};

const result = await dhanBroker.placeOrder(orderParams);
```

**Mock Order**:
```javascript
const result = dhanMock.placeOrder({
  transactionType: 'BUY',
  exchangeSegment: 'NSE',
  productType: 'CNC',
  orderType: 'MARKET',
  tradingSymbol: 'RELIANCE',
  securityId: '2885',
  quantity: 8
});
```

#### 3.4. Log Execution

**Database Record**:
```javascript
const execution = {
  id: uuidv4(),
  executionId: 'bulk-exec-id',
  userId: subscriber.id,
  userEmail: subscriber.email,
  symbol: 'RELIANCE',
  transactionType: 'BUY',
  orderType: 'MARKET',
  productType: 'CNC',
  requestedQuantity: 10,
  executedQuantity: 8,
  price: 2950.50,
  status: 'SUCCESS',
  errorReason: null,
  orderDetails: result,
  timestamp: new Date()
};

await db.order_executions.insertOne(execution);
```

### 4. Return Results

**Response Structure**:
```json
{
  "message": "Bulk order execution completed",
  "executionId": "exec-abc-123",
  "totalSubscribers": 2,
  "successfulExecutions": 2,
  "failedExecutions": 0,
  "results": [
    {
      "id": "result-1",
      "userId": "john-id",
      "userEmail": "john@example.com",
      "symbol": "RELIANCE",
      "status": "SUCCESS",
      "executedQuantity": 8,
      "broker": "Dhan"
    },
    {
      "id": "result-2",
      "userId": "jane-id",
      "userEmail": "jane@example.com",
      "symbol": "RELIANCE",
      "status": "SUCCESS",
      "executedQuantity": 8,
      "broker": "Mock"
    }
  ]
}
```

## Order Types Supported

### 1. Market Order

**Description**: Order executed at current market price

**Parameters**:
- No price required
- Immediate execution
- Best available price

**Example**:
```json
{
  "orderType": "MARKET",
  "quantity": 10
}
```

### 2. Limit Order

**Description**: Order executed only at specified price or better

**Parameters**:
- Price required
- May not execute immediately
- Better price control

**Example**:
```json
{
  "orderType": "LIMIT",
  "quantity": 10,
  "price": 2950.00
}
```

## Product Types

### 1. CNC (Cash and Carry)

**Description**: Delivery-based trading

**Characteristics**:
- Shares credited to demat account
- Can be held long-term
- Full payment required
- No leverage

### 2. INTRADAY (MIS)

**Description**: Margin Intraday Square-off

**Characteristics**:
- Must be squared off same day
- Leverage available
- Auto square-off at 3:20 PM
- Lower capital requirement

## Error Handling

### Common Errors

#### 1. Insufficient Funds
```json
{
  "status": "FAILED",
  "errorReason": "Insufficient funds - cannot afford even 1 share"
}
```

**Cause**: User's 25% capital allocation insufficient for even 1 share

**Solution**: User needs to increase capital allocation

#### 2. Stock Not in Portfolio
```json
{
  "status": "FAILED",
  "errorReason": "Stock not available in portfolio"
}
```

**Cause**: Attempting to sell stock not owned

**Solution**: Check holdings before placing sell order

#### 3. Dhan API Error
```json
{
  "status": "FAILED",
  "errorReason": "Dhan API error: Invalid security ID"
}
```

**Cause**: API rejected the order

**Solution**: Verify stock details and try again

#### 4. Broker Not Connected
```json
{
  "status": "SUCCESS",
  "broker": "Mock",
  "note": "Mock execution - broker not connected"
}
```

**Cause**: User hasn't connected Dhan broker

**Solution**: User should connect broker in settings

## Capital Allocation Rules

### BUY Orders

1. System uses **25% of max allocated capital** per order
2. Calculates maximum buyable quantity: `floor(capital * 0.25 / stock_price)`
3. Takes minimum of requested and maximum quantity
4. If max quantity is 0, order fails

**Example**:
- Max Capital: ₹100,000
- Capital per order: ₹25,000
- Stock Price: ₹2,950
- Max Quantity: floor(25000 / 2950) = 8 shares
- If admin requests 10, system orders 8

### SELL Orders

1. No capital calculation needed
2. Checks if stock exists in portfolio
3. Takes minimum of requested and available quantity
4. If stock not found, order fails

**Example**:
- Holding: 5 shares of RELIANCE
- Admin requests: 10 shares
- System sells: 5 shares (available quantity)

## Database Schema

### order_executions Collection

```javascript
{
  _id: ObjectId,
  id: "uuid",
  executionId: "bulk-exec-id",       // Same for all orders in bulk
  userId: "user-id",
  userEmail: "user@example.com",
  symbol: "RELIANCE",
  transactionType: "BUY" | "SELL",
  orderType: "MARKET" | "LIMIT",
  productType: "CNC" | "INTRADAY",
  requestedQuantity: 10,
  executedQuantity: 8,
  price: 2950.50,
  status: "SUCCESS" | "FAILED",
  errorReason: "Error message" | null,
  orderDetails: {
    orderId: "dhan-order-id",
    broker: "Dhan" | "Mock",
    timestamp: "ISO-8601"
  },
  timestamp: Date
}
```

## Performance Considerations

### Sequential Processing

Orders are processed sequentially (one after another) for:
- Better error handling per user
- Easier debugging and tracking
- Rate limit compliance
- Database consistency

### Rate Limits

Dhan API rate limits:
- 25 orders/second
- 250 orders/minute
- 1,000 orders/hour
- 7,000 orders/day

For bulk orders with many subscribers, consider:
- Batch processing
- Delay between orders
- Queue mechanism

## Testing Recommendations

### Development Testing

1. **Test with Mock First**:
   - Register test users
   - Don't connect broker
   - Verify order flow

2. **Test Capital Allocation**:
   - Different capital amounts
   - Various stock prices
   - Edge cases (0 quantity)

3. **Test Error Scenarios**:
   - Insufficient funds
   - Stock not in portfolio
   - Invalid stock symbols

### Production Testing

1. **Start Small**:
   - Single user
   - Small quantities
   - Monitor closely

2. **Gradually Scale**:
   - Add more users
   - Increase quantities
   - Verify all executions

3. **Monitor Logs**:
   - Check execution results
   - Verify Dhan responses
   - Track error rates

## Security Considerations

1. **Access Token Protection**:
   - Never log access tokens
   - Store encrypted in database
   - Don't expose in responses

2. **Order Validation**:
   - Verify admin role
   - Check subscription status
   - Validate stock symbols

3. **Rate Limiting**:
   - Respect Dhan limits
   - Implement queuing if needed
   - Monitor usage

4. **Error Handling**:
   - Don't expose sensitive data
   - Log for debugging
   - Return user-friendly messages

## Monitoring and Logging

### Key Metrics to Track

1. **Execution Success Rate**:
   - Total orders vs successful
   - Per-user success rate
   - Per-broker success rate

2. **Order Processing Time**:
   - Time per order
   - Total bulk execution time
   - API response times

3. **Error Analysis**:
   - Error types and frequency
   - User-specific issues
   - API failure patterns

### Recommended Logging

```javascript
console.log('Bulk execution started', {
  executionId,
  totalSubscribers,
  symbol,
  transactionType
});

console.log('Order executed', {
  userId,
  status,
  quantity,
  broker,
  orderId
});

console.log('Bulk execution completed', {
  executionId,
  successful,
  failed,
  duration
});
```

## Future Enhancements

1. **Parallel Processing**: Execute orders for multiple users simultaneously
2. **Smart Routing**: Automatically route to best available broker
3. **Order Batching**: Combine orders for efficiency
4. **Real-time Updates**: WebSocket notifications for order status
5. **Advanced Algorithms**: VWAP, TWAP execution strategies

## Support

For issues with:
- **Order Workflow**: Check this document and IMPLEMENTATION_SUMMARY.md
- **Dhan Integration**: See DHAN_INTEGRATION.md
- **API Errors**: Contact Dhan support at https://dhan.co/support
