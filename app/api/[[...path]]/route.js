import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

const client = new MongoClient(process.env.MONGO_URL);
let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(process.env.DB_NAME || 'stocksync');
  }
  return db;
}

// Dhan API Mock Implementation
const dhanMock = {
  // Mock Indian stocks data
  stocks: [
    { symbol: 'RELIANCE', securityId: '2885', name: 'Reliance Industries Ltd', price: 2950.50, exchange: 'NSE' },
    { symbol: 'TCS', securityId: '11536', name: 'Tata Consultancy Services Ltd', price: 4120.75, exchange: 'NSE' },
    { symbol: 'HDFCBANK', securityId: '1333', name: 'HDFC Bank Ltd', price: 1580.25, exchange: 'NSE' },
    { symbol: 'INFY', securityId: '1594', name: 'Infosys Ltd', price: 1805.60, exchange: 'NSE' },
    { symbol: 'ICICIBANK', securityId: '4963', name: 'ICICI Bank Ltd', price: 1245.80, exchange: 'NSE' },
    { symbol: 'HINDUNILVR', securityId: '356', name: 'Hindustan Unilever Ltd', price: 2380.90, exchange: 'NSE' },
    { symbol: 'ITC', securityId: '424', name: 'ITC Ltd', price: 465.35, exchange: 'NSE' },
    { symbol: 'BHARTIARTL', securityId: '10604', name: 'Bharti Airtel Ltd', price: 1520.40, exchange: 'NSE' },
    { symbol: 'KOTAKBANK', securityId: '1922', name: 'Kotak Mahindra Bank Ltd', price: 1890.65, exchange: 'NSE' },
    { symbol: 'LT', securityId: '11483', name: 'Larsen & Toubro Ltd', price: 3560.25, exchange: 'NSE' }
  ],

  // Mock order placement response
  placeOrder: (orderData) => {
    const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
    return {
      orderId: orderId,
      status: 'PENDING',
      orderStatus: 'PLACED',
      transactionType: orderData.transactionType,
      exchangeSegment: orderData.exchangeSegment,
      productType: orderData.productType,
      orderType: orderData.orderType,
      tradingSymbol: orderData.tradingSymbol,
      securityId: orderData.securityId,
      quantity: orderData.quantity,
      price: orderData.price,
      timestamp: new Date().toISOString()
    };
  },

  // Mock holdings response
  getHoldings: (userId) => {
    return [
      { symbol: 'RELIANCE', quantity: 50, avgPrice: 2800, currentPrice: 2950.50, totalValue: 147525 },
      { symbol: 'TCS', quantity: 25, avgPrice: 4000, currentPrice: 4120.75, totalValue: 103018.75 },
      { symbol: 'HDFCBANK', quantity: 100, avgPrice: 1500, currentPrice: 1580.25, totalValue: 158025 }
    ];
  },

  // Mock funds response
  getFunds: (userId) => {
    return {
      availablecash: Math.floor(Math.random() * 500000) + 100000, // Random between 1L to 6L
      collateral: 0,
      intraday: Math.floor(Math.random() * 1000000) + 200000,
      total: function() { return this.availablecash + this.intraday; }
    };
  }
};

// Authentication helper
async function authenticateUser(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const database = await connectDB();
  const user = await database.collection('users').findOne({ token });
  return user;
}

// Admin check helper
function isAdmin(user) {
  return user && user.role === 'admin';
}

export async function POST(request, { params }) {
  try {
    const database = await connectDB();
    const path = params.path ? params.path.join('/') : '';
    const body = await request.json();

    // Auth endpoints
    if (path === 'auth/register') {
      const { email, password, name } = body;
      
      const existingUser = await database.collection('users').findOne({ email });
      if (existingUser) {
        return NextResponse.json({ error: 'User already exists' }, { status: 400 });
      }

      const userId = uuidv4();
      const token = `token_${userId}`;
      
      const user = {
        id: userId,
        email,
        password, // In production, hash this
        name,
        role: 'user',
        subscriptionStatus: 'inactive',
        brokerConnections: [],
        maxCapital: 100000,
        token,
        createdAt: new Date()
      };

      await database.collection('users').insertOne(user);
      
      return NextResponse.json({ 
        message: 'User registered successfully',
        user: { id: userId, email, name, role: user.role, subscriptionStatus: user.subscriptionStatus },
        token 
      });
    }

    if (path === 'auth/login') {
      const { email, password } = body;
      
      const user = await database.collection('users').findOne({ email, password });
      if (!user) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      return NextResponse.json({ 
        message: 'Login successful',
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role,
          subscriptionStatus: user.subscriptionStatus,
          maxCapital: user.maxCapital
        },
        token: user.token 
      });
    }

    // Protected routes - require authentication
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin routes
    if (path === 'admin/execute-order') {
      if (!isAdmin(user)) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }

      const { symbol, transactionType, orderType, quantity, price, productType = 'CNC' } = body;

      // Get all active subscribers
      const activeUsers = await database.collection('users').find({ 
        subscriptionStatus: 'active',
        role: 'user'
      }).toArray();

      if (activeUsers.length === 0) {
        return NextResponse.json({ error: 'No active subscribers found' }, { status: 400 });
      }

      // Find stock data
      const stock = dhanMock.stocks.find(s => s.symbol === symbol);
      if (!stock) {
        return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
      }

      const executionResults = [];
      const executionId = uuidv4();

      for (const subscriber of activeUsers) {
        try {
          let orderQuantity = quantity;
          let canExecute = true;
          let errorReason = null;

          if (transactionType === 'BUY') {
            // For buy orders, calculate quantity based on 25% of max capital
            const capitalToUse = subscriber.maxCapital * 0.25;
            const maxQuantityBuyable = Math.floor(capitalToUse / stock.price);
            orderQuantity = Math.min(quantity, maxQuantityBuyable);

            if (orderQuantity === 0) {
              canExecute = false;
              errorReason = 'Insufficient funds - cannot afford even 1 share';
            }
          } else if (transactionType === 'SELL') {
            // For sell orders, check if user has the stock in portfolio
            const holdings = dhanMock.getHoldings(subscriber.id);
            const holding = holdings.find(h => h.symbol === symbol);
            
            if (!holding) {
              canExecute = false;
              errorReason = 'Stock not available in portfolio';
            } else if (holding.quantity < quantity) {
              orderQuantity = holding.quantity; // Sell available quantity
            }
          }

          let orderResult = null;
          if (canExecute) {
            // Mock order placement
            orderResult = dhanMock.placeOrder({
              transactionType,
              exchangeSegment: stock.exchange,
              productType,
              orderType,
              tradingSymbol: symbol,
              securityId: stock.securityId,
              quantity: orderQuantity,
              price: price || stock.price
            });

            // Simulate some random order execution results
            const executionSuccess = Math.random() > 0.1; // 90% success rate
            orderResult.status = executionSuccess ? 'EXECUTED' : 'FAILED';
            if (!executionSuccess) {
              errorReason = 'Market execution failed - insufficient liquidity';
            }
          }

          const execution = {
            id: uuidv4(),
            executionId,
            userId: subscriber.id,
            userEmail: subscriber.email,
            symbol,
            transactionType,
            orderType,
            productType,
            requestedQuantity: quantity,
            executedQuantity: canExecute ? orderQuantity : 0,
            price: price || stock.price,
            status: canExecute && orderResult?.status === 'EXECUTED' ? 'SUCCESS' : 'FAILED',
            errorReason,
            orderDetails: orderResult,
            timestamp: new Date()
          };

          await database.collection('order_executions').insertOne(execution);
          executionResults.push(execution);

        } catch (error) {
          const execution = {
            id: uuidv4(),
            executionId,
            userId: subscriber.id,
            userEmail: subscriber.email,
            symbol,
            transactionType,
            orderType,
            productType,
            requestedQuantity: quantity,
            executedQuantity: 0,
            price: price || stock.price,
            status: 'FAILED',
            errorReason: 'System error: ' + error.message,
            timestamp: new Date()
          };

          await database.collection('order_executions').insertOne(execution);
          executionResults.push(execution);
        }
      }

      return NextResponse.json({
        message: 'Bulk order execution completed',
        executionId,
        totalSubscribers: activeUsers.length,
        successfulExecutions: executionResults.filter(r => r.status === 'SUCCESS').length,
        failedExecutions: executionResults.filter(r => r.status === 'FAILED').length,
        results: executionResults
      });
    }

    if (path === 'admin/subscribers') {
      if (!isAdmin(user)) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }

      const subscribers = await database.collection('users').find({ 
        role: 'user' 
      }).project({ password: 0, token: 0 }).toArray();

      return NextResponse.json({ subscribers });
    }

    if (path === 'admin/update-subscription') {
      if (!isAdmin(user)) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }

      const { userId, subscriptionStatus } = body;
      
      await database.collection('users').updateOne(
        { id: userId },
        { $set: { subscriptionStatus, updatedAt: new Date() } }
      );

      return NextResponse.json({ message: 'Subscription status updated successfully' });
    }

    // User routes
    if (path === 'user/connect-broker') {
      const { brokerName, apiKey, apiSecret, clientId } = body;
      
      const brokerConnection = {
        id: uuidv4(),
        brokerName,
        apiKey,
        apiSecret,
        clientId,
        status: 'connected',
        connectedAt: new Date()
      };

      await database.collection('users').updateOne(
        { id: user.id },
        { $push: { brokerConnections: brokerConnection } }
      );

      return NextResponse.json({ message: 'Broker connected successfully', connection: brokerConnection });
    }

    if (path === 'user/update-capital') {
      const { maxCapital } = body;
      
      await database.collection('users').updateOne(
        { id: user.id },
        { $set: { maxCapital, updatedAt: new Date() } }
      );

      return NextResponse.json({ message: 'Capital allocation updated successfully' });
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const database = await connectDB();
    const path = params.path ? params.path.join('/') : '';
    const url = new URL(request.url);
    
    // Public endpoints
    if (path === 'stocks/search') {
      const query = url.searchParams.get('q') || '';
      const filteredStocks = dhanMock.stocks.filter(stock => 
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
      );
      return NextResponse.json({ stocks: filteredStocks });
    }

    // Protected routes
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (path === 'admin/execution-history') {
      if (!isAdmin(user)) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }

      const executions = await database.collection('order_executions')
        .find({})
        .sort({ timestamp: -1 })
        .limit(100)
        .toArray();

      return NextResponse.json({ executions });
    }

    if (path === 'user/portfolio') {
      const holdings = dhanMock.getHoldings(user.id);
      return NextResponse.json({ holdings });
    }

    if (path === 'user/funds') {
      const funds = dhanMock.getFunds(user.id);
      return NextResponse.json({ funds });
    }

    if (path === 'user/orders') {
      const orders = await database.collection('order_executions')
        .find({ userId: user.id })
        .sort({ timestamp: -1 })
        .limit(50)
        .toArray();

      return NextResponse.json({ orders });
    }

    if (path === 'admin/subscribers') {
      if (!isAdmin(user)) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }

      const subscribers = await database.collection('users').find({ 
        role: 'user' 
      }).project({ password: 0, token: 0 }).toArray();

      return NextResponse.json({ subscribers });
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}