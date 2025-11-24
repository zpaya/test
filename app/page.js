'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ArrowUpIcon, ArrowDownIcon, Users, TrendingUp, Wallet, Activity, Search, Play, Settings } from 'lucide-react';

export default function StockSyncApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('login');
  
  // Auth state
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '' });
  
  // Admin state
  const [stockSearch, setStockSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [orderData, setOrderData] = useState({
    transactionType: 'BUY',
    orderType: 'MARKET',
    quantity: 1,
    price: '',
    productType: 'CNC'
  });
  const [executionResults, setExecutionResults] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [executionHistory, setExecutionHistory] = useState([]);
  
  // User state
  const [portfolio, setPortfolio] = useState([]);
  const [funds, setFunds] = useState({});
  const [userOrders, setUserOrders] = useState([]);
  const [brokerData, setBrokerData] = useState({
    brokerName: 'Dhan',
    apiKey: '',
    apiSecret: '',
    clientId: '',
    accessToken: ''
  });
  const [maxCapital, setMaxCapital] = useState(100000);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      if (JSON.parse(savedUser).role === 'admin') {
        loadAdminData();
      } else {
        loadUserData();
      }
    }
  }, []);

  // Initialize admin and sample users on first load
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Create admin user if not exists
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Admin User',
          email: 'admin@stocksync.com',
          password: 'admin123'
        })
      });

      // Create sample users
      const sampleUsers = [
        { name: 'John Doe', email: 'john@example.com', password: 'user123' },
        { name: 'Jane Smith', email: 'jane@example.com', password: 'user123' },
        { name: 'Bob Wilson', email: 'bob@example.com', password: 'user123' }
      ];

      for (const userData of sampleUsers) {
        await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });
      }

      // Update admin role and activate sample users (this would be done via direct DB update in real scenario)
    } catch (error) {
      console.log('Initialization completed or users already exist');
    }
  };

  const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }
    
    return response.json();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await apiCall('auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData)
      });
      
      localStorage.setItem('user', JSON.stringify(result.user));
      localStorage.setItem('token', result.token);
      setUser(result.user);
      setMessage('Login successful!');
      
      if (result.user.role === 'admin') {
        await loadAdminData();
      } else {
        await loadUserData();
      }
    } catch (error) {
      setMessage(error.message);
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await apiCall('auth/register', {
        method: 'POST',
        body: JSON.stringify(registerData)
      });
      
      setMessage('Registration successful! Please login.');
      setActiveTab('login');
    } catch (error) {
      setMessage(error.message);
    }
    setLoading(false);
  };

  const loadAdminData = async () => {
    try {
      const [subsResult, historyResult] = await Promise.all([
        apiCall('admin/subscribers'),
        apiCall('admin/execution-history')
      ]);
      setSubscribers(subsResult.subscribers);
      setExecutionHistory(historyResult.executions);
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const loadUserData = async () => {
    try {
      const [portfolioResult, fundsResult, ordersResult] = await Promise.all([
        apiCall('user/portfolio'),
        apiCall('user/funds'),
        apiCall('user/orders')
      ]);
      setPortfolio(portfolioResult.holdings);
      setFunds(fundsResult.funds);
      setUserOrders(ordersResult.orders);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const searchStocks = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      const result = await apiCall(`stocks/search?q=${encodeURIComponent(query)}`);
      setSearchResults(result.stocks);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const executeOrder = async () => {
    if (!selectedStock) {
      setMessage('Please select a stock first');
      return;
    }

    setLoading(true);
    try {
      const result = await apiCall('admin/execute-order', {
        method: 'POST',
        body: JSON.stringify({
          symbol: selectedStock.symbol,
          ...orderData,
          price: orderData.orderType === 'LIMIT' ? parseFloat(orderData.price) : undefined
        })
      });
      
      setExecutionResults(result);
      setMessage(`Order executed for ${result.totalSubscribers} subscribers. ${result.successfulExecutions} successful, ${result.failedExecutions} failed.`);
      await loadAdminData(); // Refresh data
    } catch (error) {
      setMessage(error.message);
    }
    setLoading(false);
  };

  const updateSubscription = async (userId, status) => {
    try {
      await apiCall('admin/update-subscription', {
        method: 'POST',
        body: JSON.stringify({ userId, subscriptionStatus: status })
      });
      await loadAdminData();
      setMessage(`Subscription ${status} successfully`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const connectBroker = async () => {
    try {
      await apiCall('user/connect-broker', {
        method: 'POST',
        body: JSON.stringify(brokerData)
      });
      setMessage('Broker connected successfully');
      await loadUserData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const updateCapital = async () => {
    try {
      await apiCall('user/update-capital', {
        method: 'POST',
        body: JSON.stringify({ maxCapital })
      });
      setMessage('Capital allocation updated successfully');
      await loadUserData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setActiveTab('login');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-width-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">StockSync</h1>
            <p className="text-lg text-gray-600">Multi-User Stock Order Execution Platform</p>
          </div>
          
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Welcome to StockSync</CardTitle>
              <CardDescription>
                Admin can execute orders for all subscribed users simultaneously
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Logging in...' : 'Login'}
                    </Button>
                  </form>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700 font-medium">Demo Accounts:</p>
                    <p className="text-xs text-blue-600">Admin: admin@stocksync.com / admin123</p>
                    <p className="text-xs text-blue-600">User: john@example.com / user123</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="register" className="space-y-4">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input
                        id="reg-email"
                        type="email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <Input
                        id="reg-password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Registering...' : 'Register'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
              
              {message && (
                <Alert className="mt-4">
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (user.role === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">StockSync Admin</h1>
              <p className="text-gray-600">Multi-user order execution dashboard</p>
            </div>
            <Button onClick={logout} variant="outline">Logout</Button>
          </div>

          {message && (
            <Alert className="mb-4">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="execute" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="execute">Execute Orders</TabsTrigger>
              <TabsTrigger value="subscribers">Manage Subscribers</TabsTrigger>
              <TabsTrigger value="history">Execution History</TabsTrigger>
            </TabsList>

            <TabsContent value="execute" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Stock Search
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Search Stock</Label>
                      <Input
                        placeholder="Enter symbol or company name"
                        value={stockSearch}
                        onChange={(e) => {
                          setStockSearch(e.target.value);
                          searchStocks(e.target.value);
                        }}
                      />
                    </div>
                    
                    {searchResults.length > 0 && (
                      <div className="max-h-60 overflow-y-auto border rounded-lg">
                        {searchResults.map((stock) => (
                          <div
                            key={stock.securityId}
                            className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                              selectedStock?.symbol === stock.symbol ? 'bg-blue-50 border-blue-200 border-2' : ''
                            }`}
                            onClick={() => {
                              setSelectedStock(stock);
                              setStockSearch(`${stock.symbol} - ${stock.name}`);
                              setSearchResults([]);
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{stock.symbol}</p>
                                <p className="text-sm text-gray-600 truncate">{stock.name}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">₹{stock.price}</p>
                                <p className="text-xs text-gray-500">{stock.exchange}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      Order Execution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedStock && (
                      <div className="p-3 bg-blue-50 rounded-lg mb-4">
                        <p className="font-medium">{selectedStock.symbol}</p>
                        <p className="text-sm text-gray-600">Current Price: ₹{selectedStock.price}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Transaction Type</Label>
                        <Select value={orderData.transactionType} onValueChange={(value) => setOrderData({...orderData, transactionType: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BUY">Buy</SelectItem>
                            <SelectItem value="SELL">Sell</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Order Type</Label>
                        <Select value={orderData.orderType} onValueChange={(value) => setOrderData({...orderData, orderType: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MARKET">Market</SelectItem>
                            <SelectItem value="LIMIT">Limit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={orderData.quantity}
                          onChange={(e) => setOrderData({...orderData, quantity: parseInt(e.target.value) || 0})}
                          min="1"
                        />
                      </div>
                      
                      {orderData.orderType === 'LIMIT' && (
                        <div className="space-y-2">
                          <Label>Price</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={orderData.price}
                            onChange={(e) => setOrderData({...orderData, price: e.target.value})}
                            placeholder="Enter price"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <Label>Product Type</Label>
                      <RadioGroup 
                        value={orderData.productType} 
                        onValueChange={(value) => setOrderData({...orderData, productType: value})}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="CNC" id="delivery" />
                          <Label htmlFor="delivery" className="cursor-pointer">Delivery</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="MIS" id="intraday" />
                          <Label htmlFor="intraday" className="cursor-pointer">Intraday</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <Button 
                      onClick={executeOrder} 
                      className="w-full" 
                      disabled={loading || !selectedStock}
                    >
                      {loading ? 'Executing...' : `Execute for All Subscribers`}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {executionResults && (
                <Card>
                  <CardHeader>
                    <CardTitle>Execution Results</CardTitle>
                    <CardDescription>
                      Executed for {executionResults.totalSubscribers} subscribers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{executionResults.successfulExecutions}</p>
                        <p className="text-sm text-gray-600">Successful</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{executionResults.failedExecutions}</p>
                        <p className="text-sm text-gray-600">Failed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{executionResults.totalSubscribers}</p>
                        <p className="text-sm text-gray-600">Total</p>
                      </div>
                    </div>
                    
                    <Progress 
                      value={(executionResults.successfulExecutions / executionResults.totalSubscribers) * 100} 
                      className="mb-4" 
                    />
                    
                    <div className="max-h-60 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Error</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {executionResults.results.map((result) => (
                            <TableRow key={result.id}>
                              <TableCell>{result.userEmail}</TableCell>
                              <TableCell>
                                <Badge variant={result.status === 'SUCCESS' ? 'default' : 'destructive'}>
                                  {result.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{result.executedQuantity}</TableCell>
                              <TableCell className="text-sm text-red-600">{result.errorReason || 'N/A'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="subscribers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Subscriber Management
                  </CardTitle>
                  <CardDescription>Manage user subscriptions and status</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Max Capital</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscribers.map((subscriber) => (
                        <TableRow key={subscriber.id}>
                          <TableCell className="font-medium">{subscriber.name}</TableCell>
                          <TableCell>{subscriber.email}</TableCell>
                          <TableCell>
                            <Badge variant={subscriber.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                              {subscriber.subscriptionStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>₹{subscriber.maxCapital?.toLocaleString()}</TableCell>
                          <TableCell className="space-x-2">
                            {subscriber.subscriptionStatus !== 'active' && (
                              <Button 
                                size="sm" 
                                onClick={() => updateSubscription(subscriber.id, 'active')}
                              >
                                Activate
                              </Button>
                            )}
                            {subscriber.subscriptionStatus === 'active' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateSubscription(subscriber.id, 'inactive')}
                              >
                                Deactivate
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Execution History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {executionHistory.map((execution) => (
                          <TableRow key={execution.id}>
                            <TableCell className="text-sm">
                              {new Date(execution.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell>{execution.userEmail}</TableCell>
                            <TableCell className="font-medium">{execution.symbol}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {execution.transactionType === 'BUY' ? (
                                  <ArrowUpIcon className="h-4 w-4 text-green-600" />
                                ) : (
                                  <ArrowDownIcon className="h-4 w-4 text-red-600" />
                                )}
                                {execution.transactionType}
                              </div>
                            </TableCell>
                            <TableCell>{execution.executedQuantity}</TableCell>
                            <TableCell>₹{execution.price}</TableCell>
                            <TableCell>
                              <Badge variant={execution.status === 'SUCCESS' ? 'default' : 'destructive'}>
                                {execution.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // User Dashboard
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Trading Dashboard</h1>
            <p className="text-gray-600">Welcome, {user.name}</p>
          </div>
          <Button onClick={logout} variant="outline">Logout</Button>
        </div>

        {message && (
          <Alert className="mb-4">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Wallet className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Available Cash</p>
                  <p className="text-2xl font-bold">₹{funds.availablecash?.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
                  <p className="text-2xl font-bold">₹{portfolio.reduce((sum, holding) => sum + holding.totalValue, 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Subscription</p>
                  <Badge variant={user.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                    {user.subscriptionStatus}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="portfolio" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Holdings</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stock</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Avg Price</TableHead>
                      <TableHead>Current Price</TableHead>
                      <TableHead>P&L</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portfolio.map((holding, index) => {
                      const pnl = (holding.currentPrice - holding.avgPrice) * holding.quantity;
                      const pnlPercent = ((holding.currentPrice - holding.avgPrice) / holding.avgPrice) * 100;
                      
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{holding.symbol}</TableCell>
                          <TableCell>{holding.quantity}</TableCell>
                          <TableCell>₹{holding.avgPrice}</TableCell>
                          <TableCell>₹{holding.currentPrice}</TableCell>
                          <TableCell className={pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ₹{pnl.toFixed(2)} ({pnlPercent.toFixed(2)}%)
                          </TableCell>
                          <TableCell>₹{holding.totalValue.toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="text-sm">
                          {new Date(order.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">{order.symbol}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {order.transactionType === 'BUY' ? (
                              <ArrowUpIcon className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowDownIcon className="h-4 w-4 text-red-600" />
                            )}
                            {order.transactionType}
                          </div>
                        </TableCell>
                        <TableCell>{order.executedQuantity}</TableCell>
                        <TableCell>₹{order.price}</TableCell>
                        <TableCell>
                          <Badge variant={order.status === 'SUCCESS' ? 'default' : 'destructive'}>
                            {order.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Broker Connection
                  </CardTitle>
                  <CardDescription>Connect your broker account for automated trading</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Broker</Label>
                    <Select value={brokerData.brokerName} onValueChange={(value) => setBrokerData({...brokerData, brokerName: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select broker" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dhan">Dhan</SelectItem>
                        <SelectItem value="Zerodha">Zerodha</SelectItem>
                        <SelectItem value="Upstox">Upstox</SelectItem>
                        <SelectItem value="Fyers">Fyers</SelectItem>
                        <SelectItem value="Groww">Groww</SelectItem>
                        <SelectItem value="MStock">MStock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Client ID</Label>
                    <Input
                      value={brokerData.clientId}
                      onChange={(e) => setBrokerData({...brokerData, clientId: e.target.value})}
                      placeholder="Enter your Dhan Client ID"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Access Token</Label>
                    <Input
                      type="password"
                      value={brokerData.accessToken}
                      onChange={(e) => setBrokerData({...brokerData, accessToken: e.target.value})}
                      placeholder="Enter your Dhan Access Token (JWT)"
                    />
                  </div>

                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-xs text-amber-800">
                      <strong>Dhan Setup:</strong> Get your Client ID and Access Token from Dhan Trading Platform. Access Token is a JWT that authenticates your API requests.
                    </p>
                  </div>
                  
                  <Button onClick={connectBroker} className="w-full">
                    Connect Broker
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Capital Allocation</CardTitle>
                  <CardDescription>Set your maximum capital for automated trading</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Maximum Capital (₹)</Label>
                    <Input
                      type="number"
                      value={maxCapital}
                      onChange={(e) => setMaxCapital(parseInt(e.target.value) || 0)}
                      placeholder="Enter maximum capital"
                    />
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Note:</strong> Each buy order will use 25% of your allocated capital (₹{(maxCapital * 0.25).toLocaleString()})
                    </p>
                  </div>
                  
                  <Button onClick={updateCapital} className="w-full">
                    Update Capital Allocation
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}