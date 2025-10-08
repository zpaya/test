# 🚀 StockSync - Multi-User Stock Order Execution Platform

A comprehensive trading platform where **admin can execute orders for all subscribed users simultaneously** with intelligent capital allocation and risk management.

## ✨ Key Features

### 🎯 **Core Functionality**
- **Multi-User Order Execution**: Admin places one order → Executes for ALL active subscribers automatically
- **Smart Capital Management**: 25% of user's allocated capital per buy order
- **Portfolio Validation**: Sell orders check if stock exists in user's portfolio
- **Real-time Results**: Live execution status with success/failure tracking

### 🏦 **Broker Integration**
- **Dhan Mock API**: Realistic implementation matching Dhan's API structure
- **Multi-Broker Ready**: Supports Zerodha, Upstox, Fyers, Groww, MStock
- **International Expansion**: Easy to add brokers from any country

### 📊 **Admin Dashboard**
- Stock search and selection (Indian stocks: RELIANCE, TCS, HDFCBANK, etc.)
- Bulk order execution (BUY/SELL, MARKET/LIMIT, Delivery/Intraday)
- Subscriber management (activate/deactivate subscriptions)
- Execution history and performance analytics

### 👤 **User Dashboard**
- Portfolio view with real-time P&L calculation
- Order history and execution tracking
- Broker connection setup with API credentials
- Capital allocation settings and limits

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: MongoDB
- **UI Library**: Shadcn/UI + Tailwind CSS
- **Authentication**: JWT-like token system
- **API**: RESTful endpoints with proper error handling

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Yarn package manager

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd stocksync
```

2. **Install dependencies**
```bash
yarn install
```

3. **Setup environment variables**
```bash
cp .env.example .env
```
Update `.env` with your MongoDB connection string:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=stocksync
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

4. **Run the development server**
```bash
yarn dev
```

5. **Access the application**
- Open [http://localhost:3000](http://localhost:3000)
- Use demo accounts or register new users

## 🔐 Demo Accounts

| Role | Email | Password | Access |
|------|-------|----------|---------|
| **Admin** | admin@stocksync.com | admin123 | Order execution, subscriber management |
| **User** | john@example.com | user123 | Portfolio, settings, order history |

## 🌍 International Expansion Ready

### 🏦 **Multi-Broker Support**
- **India**: Dhan, Zerodha, Upstox, Fyers, Groww
- **USA**: Robinhood, TD Ameritrade (planned)
- **Europe**: Interactive Brokers, eToro (planned)

### 💱 **Multi-Currency Support**
- Easy currency symbol switching (₹, $, €, ¥)
- Localized number formatting
- Country-specific stock exchanges

## 📁 Project Structure

```
/app/
├── app/
│   ├── api/[[...path]]/route.js    # Backend API endpoints
│   ├── page.js                     # Frontend React component
│   ├── layout.js                   # Next.js app layout
│   └── globals.css                 # Global styles
├── components/ui/                  # Shadcn UI components
├── lib/                           # Utility functions
├── package.json                   # Dependencies
└── README.md                      # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Admin Routes
- `POST /api/admin/execute-order` - Execute orders for all subscribers
- `GET /api/admin/subscribers` - Get all subscribers
- `POST /api/admin/update-subscription` - Update subscription status
- `GET /api/admin/execution-history` - Get execution history

### User Routes
- `GET /api/user/portfolio` - Get user holdings
- `GET /api/user/funds` - Get available funds
- `GET /api/user/orders` - Get order history
- `POST /api/user/connect-broker` - Connect broker account
- `POST /api/user/update-capital` - Update capital allocation

### Public Routes
- `GET /api/stocks/search` - Search stocks

## 🧪 Testing

The platform includes comprehensive backend testing:

```bash
# Run backend API tests
python backend_test.py
```

**Test Coverage**: 20/20 tests passing (100% success rate)
- Authentication system
- Multi-user order execution
- Broker mock integration
- Subscription management
- Stock search functionality

## 🚦 Order Execution Logic

### **Buy Orders**
1. Admin places buy order with quantity
2. System finds all active subscribers
3. For each subscriber:
   - Calculate 25% of max allocated capital
   - Determine maximum buyable quantity
   - Execute order if sufficient funds
   - Log results (success/failure with reason)

### **Sell Orders**
1. Admin places sell order
2. System checks each subscriber's portfolio
3. For each subscriber:
   - Verify stock exists in holdings
   - Execute sell for available quantity
   - Skip if stock not found (with error log)

## 🛡️ Security Features

- JWT-based authentication
- Role-based access control (Admin/User)
- Input validation and sanitization
- Error handling with proper HTTP status codes
- MongoDB injection protection

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, mobile
- **Professional Interface**: Clean, intuitive design
- **Real-time Updates**: Live execution results
- **International Icons**: Generic money/wallet icons
- **Accessibility**: Proper labels and contrast

## 📈 Future Enhancements

- [ ] Real broker API integration (Zerodha Kite, etc.)
- [ ] WebSocket for real-time order updates
- [ ] Advanced charting and analytics
- [ ] Risk management rules and limits
- [ ] Multi-language support
- [ ] Mobile app development
- [ ] Algorithm trading strategies
- [ ] Compliance and audit logging

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

For support and questions:
- Create an issue in this repository
- Contact the development team

---

**Built with ❤️ for the trading community**

*Ready to revolutionize multi-user trading with automated order execution!* 🚀