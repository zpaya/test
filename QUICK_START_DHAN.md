# Quick Start: Dhan Integration

## 5-Minute Setup Guide

### For Users

#### Step 1: Get Dhan Credentials

1. Log in to your Dhan account at https://dhan.co
2. Navigate to **API Settings** section
3. Generate your **Access Token** (JWT)
4. Note your **Client ID**

#### Step 2: Connect to StockSync

1. Log in to StockSync
2. Go to **Settings → Broker Connection**
3. Select **Dhan** from dropdown
4. Enter your credentials:
   - **Client ID**: Your Dhan client ID
   - **Access Token**: The JWT token from Dhan
5. Click **Connect Broker**
6. Wait for verification (green checkmark = success!)

#### Step 3: Set Capital Allocation

1. In the same Settings page, find **Capital Allocation**
2. Enter your maximum trading capital (e.g., ₹100,000)
3. Click **Update Capital Allocation**

**Note**: System uses 25% of this capital per buy order

#### Step 4: Activate Subscription

Ask your admin to activate your subscription. Once active, you'll automatically receive orders!

### For Admin

#### Prerequisites

1. Ensure your server has a **static IP address**
2. Contact Dhan support to **whitelist your server IP**
3. This is required for order placement APIs

#### Executing Orders

1. Log in as admin
2. Go to **Execute Orders** tab
3. Search for a stock (e.g., RELIANCE)
4. Set order parameters:
   - Transaction: BUY or SELL
   - Type: MARKET or LIMIT
   - Quantity: Number of shares
   - Product: Delivery (CNC) or Intraday
5. Click **Execute for All Subscribers**
6. View results in real-time

#### Managing Subscribers

1. Go to **Manage Subscribers** tab
2. View all registered users
3. Click **Activate** to enable auto-trading for a user
4. Click **Deactivate** to pause auto-trading

## Understanding the Results

### Execution Summary

When you execute an order, you'll see:

```
Total Subscribers: 5
✅ Successful: 4
❌ Failed: 1
```

### Individual Results

Each user's result shows:
- **User Email**: Which user
- **Status**: SUCCESS or FAILED
- **Quantity**: How many shares executed
- **Error**: Reason for failure (if any)

### Common Status Messages

#### ✅ SUCCESS
- Order placed successfully
- Either via Dhan API (real) or Mock (testing)

#### ❌ FAILED - Insufficient Funds
- User doesn't have enough capital
- Solution: User should increase capital allocation

#### ❌ FAILED - Stock Not in Portfolio
- Trying to sell stock user doesn't own
- Solution: Only sell stocks in portfolio

#### ❌ FAILED - Dhan API Error
- Real API rejected the order
- Solution: Check error message and retry

## Order Flow Example

### Scenario
- Admin places BUY order for 10 shares of RELIANCE at ₹2,950

### User 1 (Connected to Dhan)
```
Max Capital: ₹100,000
25% Capital: ₹25,000
Stock Price: ₹2,950
Max Qty: 8 shares
Result: ✅ 8 shares via Dhan API
```

### User 2 (Not Connected)
```
Max Capital: ₹100,000
25% Capital: ₹25,000
Stock Price: ₹2,950
Max Qty: 8 shares
Result: ✅ 8 shares via Mock
```

### User 3 (Low Capital)
```
Max Capital: ₹5,000
25% Capital: ₹1,250
Stock Price: ₹2,950
Max Qty: 0 shares
Result: ❌ Insufficient funds
```

## Important Notes

### ⚠️ Real Money Trading

When Dhan is connected, orders are **REAL** and involve **actual money**:
- Test thoroughly before connecting real broker
- Start with small quantities
- Monitor executions closely
- Only trade during market hours

### 🕐 Market Hours

Indian stock market hours (IST):
- **Pre-market**: 9:00 AM - 9:15 AM
- **Regular**: 9:15 AM - 3:30 PM
- **Post-market**: 3:40 PM - 4:00 PM

Orders can only be placed during regular hours.

### 💰 Capital Calculation

For BUY orders, system automatically:
1. Takes 25% of your max capital
2. Divides by stock price
3. Floors to get whole number of shares
4. Orders that quantity (or less if admin requested less)

For SELL orders:
1. Checks your portfolio
2. Takes minimum of requested and available
3. Fails if stock not owned

### 🔒 Static IP Requirement

Dhan requires your server IP to be whitelisted:
1. Find your server's static IP
2. Contact Dhan support
3. Request whitelisting for order APIs
4. Wait for confirmation

Without this, order placement will fail with authentication error.

## Troubleshooting

### Can't Connect Broker

**Problem**: "Invalid credentials" error

**Solutions**:
- Verify Client ID is correct
- Check Access Token hasn't expired
- Ensure token copied completely
- Generate new token if needed

### Orders Not Executing

**Problem**: Orders show as "FAILED"

**Solutions**:
- Check if subscription is active
- Verify sufficient capital allocation
- Ensure market is open
- Check for API error messages

### Mock Orders Only

**Problem**: All orders use mock, not real Dhan

**Solutions**:
- Verify broker connection status
- Check if Access Token is saved
- Reconnect broker if needed
- Check browser console for errors

### Static IP Error

**Problem**: "Static IP required" error

**Solutions**:
- Contact Dhan support
- Provide your server's static IP
- Wait for whitelisting
- Test after confirmation

## Testing Checklist

Before going live:

- [ ] Connect Dhan broker successfully
- [ ] Set reasonable capital allocation
- [ ] Activate subscription
- [ ] Test with 1 share of cheap stock
- [ ] Verify order appears in Dhan account
- [ ] Test BUY order
- [ ] Test SELL order
- [ ] Test with insufficient funds
- [ ] Test during market hours
- [ ] Monitor execution results

## Next Steps

1. **Start Testing**: Connect broker and test with small amounts
2. **Read Docs**: Check DHAN_INTEGRATION.md for complete details
3. **Monitor Orders**: Watch first few executions closely
4. **Scale Up**: Gradually increase order sizes
5. **Automate**: Let system handle bulk executions

## Support

Need help?

- **Technical Issues**: See IMPLEMENTATION_SUMMARY.md
- **Order Flow**: See ORDER_WORKFLOW.md
- **Dhan API**: https://dhanhq.co/docs/v2/
- **Dhan Support**: https://dhan.co/support

## Quick Links

- Dhan Platform: https://dhan.co
- Dhan API Docs: https://dhanhq.co/docs/v2/
- Dhan Support: https://dhan.co/support

---

**Happy Trading! 📈🚀**
