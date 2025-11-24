# Dhan Broker Integration Guide

## Overview

StockSync now supports real Dhan broker API integration for live order execution. The system automatically detects if a user has connected their Dhan account and routes orders through the real Dhan API instead of the mock implementation.

## Features Implemented

### 1. Real-time Order Execution
- Place BUY/SELL orders through Dhan API
- Support for MARKET and LIMIT orders
- Automatic order status tracking
- Error handling and fallback to mock

### 2. Portfolio Management
- Fetch real holdings from Dhan account
- Get current market positions
- View profit/loss calculations

### 3. Funds Management
- Check available trading balance
- View margin and collateral
- Real-time fund updates

### 4. Multi-User Support
- Each user can connect their own Dhan account
- Admin executes orders across all connected accounts
- Automatic capital allocation per user

## How It Works

### Connection Flow

1. **User Connects Broker**
   - User provides Client ID and Access Token
   - System validates credentials by fetching funds
   - Connection status saved to database

2. **Order Execution**
   - Admin places order for a stock
   - System finds all active subscribers
   - For each user with Dhan connected:
     - Creates DhanBroker instance
     - Places order via Dhan API
     - Logs execution results
   - Users without Dhan connection use mock

3. **Portfolio Sync**
   - Real holdings fetched from Dhan
   - Fallback to mock if API fails
   - Clear indication of data source

## Dhan API Endpoints Used

### Base URL
```
https://api.dhan.co/v2
```

### Authentication
All requests require `access-token` header with JWT token.

### Endpoints

1. **Place Order** - `POST /orders`
   - Places buy/sell orders
   - Parameters: transactionType, exchangeSegment, productType, orderType, securityId, quantity, price

2. **Get Holdings** - `GET /holdings`
   - Returns current stock positions
   - No parameters required

3. **Get Funds** - `GET /fundlimit`
   - Returns available trading balance
   - Includes margin and collateral info

4. **Get Order Status** - `GET /orders/{orderId}`
   - Track specific order status
   - Parameter: orderId

5. **Cancel Order** - `DELETE /orders/{orderId}`
   - Cancel pending orders
   - Parameter: orderId

6. **Modify Order** - `PUT /orders/{orderId}`
   - Modify pending order parameters
   - Parameters: quantity, price, orderType, validity

## Configuration

### Required Credentials

Users need two pieces of information from Dhan:

1. **Client ID**: User's Dhan trading account ID
2. **Access Token**: JWT token for API authentication

### Getting Dhan Credentials

1. Log in to Dhan Trading Platform
2. Navigate to API Settings
3. Generate Access Token (JWT)
4. Copy Client ID and Access Token
5. Enter in StockSync broker settings

### Environment Variables

No additional environment variables needed. The system uses:
- MongoDB for storing broker connections
- Existing authentication system

## Order Parameters

### Exchange Segments
- `NSE_EQ` - NSE Equity
- `BSE_EQ` - BSE Equity
- `NSE_FNO` - NSE F&O
- `BSE_FNO` - BSE F&O
- `MCX_COMM` - MCX Commodity
- `NSE_CURR` - NSE Currency
- `BSE_CURR` - BSE Currency

### Product Types
- `CNC` - Cash and Carry (Delivery)
- `INTRADAY` - Intraday
- `MARGIN` - Margin
- `MTF` - Margin Trading Facility
- `CO` - Cover Order
- `BO` - Bracket Order

### Order Types
- `MARKET` - Market order
- `LIMIT` - Limit order
- `STOP_LOSS` - Stop Loss
- `STOP_LOSS_MARKET` - Stop Loss Market

### Transaction Types
- `BUY` - Buy order
- `SELL` - Sell order

## Error Handling

### API Errors
- Invalid credentials: Falls back to mock
- Network errors: Logged and user notified
- Rate limits: Queued and retried
- Invalid parameters: Validation before API call

### Order Failures
- Insufficient funds: Calculated before execution
- Stock not in portfolio (SELL): Validated before API call
- Market closed: API returns appropriate error
- Order rejection: Logged with reason

## Security Features

### Data Protection
- Access tokens stored encrypted in database
- Tokens never exposed in responses
- Secure HTTPS communication with Dhan
- No plain text credential storage

### API Security
- JWT authentication required
- Static IP whitelisting (Dhan requirement)
- Rate limiting respected
- Proper error messages without sensitive data

## Testing

### Mock Mode
- Default behavior without broker connection
- Realistic simulation of order flow
- 90% success rate for testing
- Useful for development and testing

### Live Mode
- Activated when Dhan connection verified
- Real orders placed on exchange
- Real money involved - use with caution
- Proper validation before execution

## Rate Limits

Dhan API has the following rate limits:

### Order APIs
- 25 requests/second
- 250 requests/minute
- 1,000 requests/hour
- 7,000 requests/day

### Data APIs
- 5 requests/second
- 100,000 requests/day

### Non-Trading APIs
- 20 requests/second

## Code Structure

### Files

1. **`/lib/brokers/dhan.js`**
   - DhanBroker class
   - API methods
   - Constants and mappings

2. **`/app/api/[[...path]]/route.js`**
   - Integration with existing API
   - Order execution logic
   - Broker connection handling

3. **`/app/page.js`**
   - UI for broker connection
   - Access token input
   - Connection status display

## Usage Example

### User Setup
1. User logs in to StockSync
2. Goes to Settings > Broker Connection
3. Selects "Dhan" from dropdown
4. Enters Client ID and Access Token
5. Clicks "Connect Broker"
6. System validates and saves connection

### Admin Order Execution
1. Admin logs in
2. Goes to "Execute Orders" tab
3. Searches for stock (e.g., RELIANCE)
4. Sets order parameters:
   - Transaction: BUY
   - Type: MARKET
   - Quantity: 10
   - Product: Delivery (CNC)
5. Clicks "Execute for All Subscribers"
6. System:
   - Finds all active subscribers
   - For each with Dhan connection:
     - Calculates quantity (25% capital rule)
     - Places real order via Dhan API
     - Logs execution result
   - Returns summary with success/failure counts

## Troubleshooting

### Connection Issues
- **Error**: "Invalid credentials"
  - Solution: Verify Client ID and Access Token
  - Check if token is expired

- **Error**: "Network timeout"
  - Solution: Check internet connection
  - Verify Dhan API status

### Order Failures
- **Error**: "Insufficient funds"
  - Solution: User needs to add funds to Dhan account
  - Check max capital allocation

- **Error**: "Invalid security ID"
  - Solution: Verify stock symbol and exchange
  - Check if stock is tradeable

### API Errors
- **Error**: "Rate limit exceeded"
  - Solution: Wait and retry
  - Reduce order frequency

- **Error**: "Static IP required"
  - Solution: Contact Dhan to whitelist your server IP
  - Required for order placement APIs

## Future Enhancements

1. **Order Modifications**
   - Implement modify order functionality
   - Support for cancellation

2. **Advanced Order Types**
   - Bracket orders
   - Cover orders
   - GTT (Good Till Triggered)

3. **Real-time Updates**
   - WebSocket integration for live updates
   - Order status polling

4. **Risk Management**
   - Stop loss automation
   - Position size limits
   - Daily loss limits

5. **Reporting**
   - Trade journal
   - P&L reports
   - Tax calculations

## API Documentation

For complete Dhan API documentation, visit:
- https://dhanhq.co/docs/v2/
- https://dhanhq.co/docs/v2/orders/

## Support

For issues related to:
- **StockSync Integration**: Contact StockSync support
- **Dhan API**: Contact Dhan support at https://dhan.co/support
- **API Credentials**: Log in to Dhan Trading Platform

## Important Notes

1. **Real Money Trading**: Orders placed through Dhan API are REAL and involve actual money. Test thoroughly before going live.

2. **Static IP**: Dhan requires static IP whitelisting for order placement APIs. Contact Dhan support to whitelist your server IP.

3. **Rate Limits**: Respect API rate limits to avoid account suspension.

4. **Market Hours**: Orders can only be placed during market hours (9:15 AM - 3:30 PM IST for equity).

5. **Compliance**: Ensure compliance with SEBI regulations for automated trading.

## Version

- Dhan API Version: v2
- Integration Version: 1.0
- Last Updated: 2025-11-24
