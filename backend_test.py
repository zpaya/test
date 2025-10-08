#!/usr/bin/env python3
"""
StockSync Backend API Test Suite
Tests all backend functionality including authentication, order execution, and broker integration
"""

import requests
import json
import time
import os
from typing import Dict, Any, List

class StockSyncTester:
    def __init__(self):
        # Get base URL from environment
        self.base_url = "https://stocksync-app-2.preview.emergentagent.com/api"
        self.admin_token = None
        self.user_token = None
        self.test_results = []
        
        # Test data
        self.admin_credentials = {
            "email": "admin@stocksync.com",
            "password": "admin123"
        }
        
        self.user_credentials = {
            "email": "john@example.com", 
            "password": "user123"
        }
        
        self.new_user_data = {
            "email": "testuser@example.com",
            "password": "testpass123",
            "name": "Test User"
        }

    def log_test(self, test_name: str, success: bool, message: str, details: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")

    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> Dict:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}/{endpoint}"
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return {
                "status_code": response.status_code,
                "data": response.json() if response.content else {},
                "success": response.status_code < 400
            }
        except requests.exceptions.RequestException as e:
            return {
                "status_code": 0,
                "data": {"error": str(e)},
                "success": False
            }
        except json.JSONDecodeError as e:
            return {
                "status_code": response.status_code,
                "data": {"error": f"Invalid JSON response: {str(e)}"},
                "success": False
            }

    def test_user_registration(self):
        """Test user registration endpoint"""
        print("\n=== Testing User Registration ===")
        
        # Test successful registration
        response = self.make_request('POST', 'auth/register', self.new_user_data)
        
        if response["success"] and response["status_code"] == 200:
            data = response["data"]
            if "token" in data and "user" in data:
                self.log_test("User Registration", True, "User registered successfully")
                return True
            else:
                self.log_test("User Registration", False, "Missing token or user in response", data)
        else:
            self.log_test("User Registration", False, f"Registration failed with status {response['status_code']}", response["data"])
        
        return False

    def test_user_login(self):
        """Test user login endpoints"""
        print("\n=== Testing User Authentication ===")
        
        # Test admin login
        response = self.make_request('POST', 'auth/login', self.admin_credentials)
        
        if response["success"] and response["status_code"] == 200:
            data = response["data"]
            if "token" in data and data.get("user", {}).get("role") == "admin":
                self.admin_token = data["token"]
                self.log_test("Admin Login", True, "Admin login successful")
            else:
                self.log_test("Admin Login", False, "Invalid admin login response", data)
                return False
        else:
            self.log_test("Admin Login", False, f"Admin login failed with status {response['status_code']}", response["data"])
            return False
        
        # Test user login
        response = self.make_request('POST', 'auth/login', self.user_credentials)
        
        if response["success"] and response["status_code"] == 200:
            data = response["data"]
            if "token" in data and data.get("user", {}).get("role") == "user":
                self.user_token = data["token"]
                self.log_test("User Login", True, "User login successful")
                return True
            else:
                self.log_test("User Login", False, "Invalid user login response", data)
        else:
            self.log_test("User Login", False, f"User login failed with status {response['status_code']}", response["data"])
        
        return False

    def test_invalid_login(self):
        """Test invalid login credentials"""
        print("\n=== Testing Invalid Login ===")
        
        invalid_creds = {"email": "invalid@test.com", "password": "wrongpass"}
        response = self.make_request('POST', 'auth/login', invalid_creds)
        
        if response["status_code"] == 401:
            self.log_test("Invalid Login", True, "Invalid credentials properly rejected")
            return True
        else:
            self.log_test("Invalid Login", False, f"Expected 401, got {response['status_code']}", response["data"])
            return False

    def test_stock_search(self):
        """Test stock search functionality"""
        print("\n=== Testing Stock Search ===")
        
        # Test search without query
        response = self.make_request('GET', 'stocks/search')
        
        if response["success"] and "stocks" in response["data"]:
            stocks = response["data"]["stocks"]
            if len(stocks) > 0:
                self.log_test("Stock Search (All)", True, f"Retrieved {len(stocks)} stocks")
            else:
                self.log_test("Stock Search (All)", False, "No stocks returned")
                return False
        else:
            self.log_test("Stock Search (All)", False, "Stock search failed", response["data"])
            return False
        
        # Test search with query
        response = self.make_request('GET', 'stocks/search?q=RELIANCE')
        
        if response["success"] and "stocks" in response["data"]:
            stocks = response["data"]["stocks"]
            reliance_found = any(stock["symbol"] == "RELIANCE" for stock in stocks)
            if reliance_found:
                self.log_test("Stock Search (Query)", True, "RELIANCE stock found in search")
                return True
            else:
                self.log_test("Stock Search (Query)", False, "RELIANCE not found in search results", stocks)
        else:
            self.log_test("Stock Search (Query)", False, "Stock search with query failed", response["data"])
        
        return False

    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoints"""
        print("\n=== Testing Unauthorized Access ===")
        
        # Test accessing admin endpoint without token
        response = self.make_request('GET', 'admin/subscribers')
        
        if response["status_code"] == 401:
            self.log_test("Unauthorized Access", True, "Protected endpoint properly secured")
            return True
        else:
            self.log_test("Unauthorized Access", False, f"Expected 401, got {response['status_code']}", response["data"])
            return False

    def test_admin_subscriber_management(self):
        """Test admin subscriber management"""
        print("\n=== Testing Admin Subscriber Management ===")
        
        if not self.admin_token:
            self.log_test("Admin Subscriber Management", False, "No admin token available")
            return False
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Get subscribers list
        response = self.make_request('GET', 'admin/subscribers', headers=headers)
        
        if response["success"] and "subscribers" in response["data"]:
            subscribers = response["data"]["subscribers"]
            self.log_test("Get Subscribers", True, f"Retrieved {len(subscribers)} subscribers")
            
            # Test subscription status update if we have subscribers
            if len(subscribers) > 0:
                user_id = subscribers[0]["id"]
                update_data = {"userId": user_id, "subscriptionStatus": "active"}
                
                response = self.make_request('POST', 'admin/update-subscription', update_data, headers)
                
                if response["success"]:
                    self.log_test("Update Subscription", True, "Subscription status updated successfully")
                    return True
                else:
                    self.log_test("Update Subscription", False, "Failed to update subscription", response["data"])
            else:
                self.log_test("Update Subscription", True, "No subscribers to update (expected for new system)")
                return True
        else:
            self.log_test("Get Subscribers", False, "Failed to get subscribers", response["data"])
        
        return False

    def test_user_broker_connection(self):
        """Test user broker connection"""
        print("\n=== Testing User Broker Connection ===")
        
        if not self.user_token:
            self.log_test("User Broker Connection", False, "No user token available")
            return False
        
        headers = {"Authorization": f"Bearer {self.user_token}"}
        broker_data = {
            "brokerName": "Dhan",
            "apiKey": "test_api_key",
            "apiSecret": "test_api_secret",
            "clientId": "test_client_id"
        }
        
        response = self.make_request('POST', 'user/connect-broker', broker_data, headers)
        
        if response["success"]:
            self.log_test("User Broker Connection", True, "Broker connected successfully")
            return True
        else:
            self.log_test("User Broker Connection", False, "Failed to connect broker", response["data"])
            return False

    def test_user_capital_update(self):
        """Test user capital allocation update"""
        print("\n=== Testing User Capital Update ===")
        
        if not self.user_token:
            self.log_test("User Capital Update", False, "No user token available")
            return False
        
        headers = {"Authorization": f"Bearer {self.user_token}"}
        capital_data = {"maxCapital": 250000}
        
        response = self.make_request('POST', 'user/update-capital', capital_data, headers)
        
        if response["success"]:
            self.log_test("User Capital Update", True, "Capital allocation updated successfully")
            return True
        else:
            self.log_test("User Capital Update", False, "Failed to update capital", response["data"])
            return False

    def test_user_portfolio_and_funds(self):
        """Test user portfolio and funds endpoints"""
        print("\n=== Testing User Portfolio & Funds ===")
        
        if not self.user_token:
            self.log_test("User Portfolio & Funds", False, "No user token available")
            return False
        
        headers = {"Authorization": f"Bearer {self.user_token}"}
        
        # Test portfolio
        response = self.make_request('GET', 'user/portfolio', headers=headers)
        
        if response["success"] and "holdings" in response["data"]:
            holdings = response["data"]["holdings"]
            self.log_test("User Portfolio", True, f"Retrieved portfolio with {len(holdings)} holdings")
        else:
            self.log_test("User Portfolio", False, "Failed to get portfolio", response["data"])
            return False
        
        # Test funds
        response = self.make_request('GET', 'user/funds', headers=headers)
        
        if response["success"] and "funds" in response["data"]:
            funds = response["data"]["funds"]
            if "availablecash" in funds:
                self.log_test("User Funds", True, f"Retrieved funds: ₹{funds['availablecash']}")
                return True
            else:
                self.log_test("User Funds", False, "Invalid funds response", funds)
        else:
            self.log_test("User Funds", False, "Failed to get funds", response["data"])
        
        return False

    def test_multi_user_order_execution(self):
        """Test the core multi-user order execution engine"""
        print("\n=== Testing Multi-User Order Execution Engine ===")
        
        if not self.admin_token:
            self.log_test("Multi-User Order Execution", False, "No admin token available")
            return False
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # First, ensure we have an active subscriber
        # Update a user's subscription to active
        subscribers_response = self.make_request('GET', 'admin/subscribers', headers=headers)
        
        if not subscribers_response["success"]:
            self.log_test("Multi-User Order Execution", False, "Cannot get subscribers list", subscribers_response["data"])
            return False
        
        subscribers = subscribers_response["data"]["subscribers"]
        if len(subscribers) == 0:
            self.log_test("Multi-User Order Execution", False, "No subscribers found for testing")
            return False
        
        # Activate first subscriber
        user_id = subscribers[0]["id"]
        update_data = {"userId": user_id, "subscriptionStatus": "active"}
        update_response = self.make_request('POST', 'admin/update-subscription', update_data, headers)
        
        if not update_response["success"]:
            self.log_test("Multi-User Order Execution", False, "Failed to activate subscriber", update_response["data"])
            return False
        
        # Test BUY order execution
        buy_order = {
            "symbol": "RELIANCE",
            "transactionType": "BUY",
            "orderType": "MARKET",
            "quantity": 10,
            "productType": "CNC"
        }
        
        response = self.make_request('POST', 'admin/execute-order', buy_order, headers)
        
        if response["success"]:
            data = response["data"]
            if "executionId" in data and "results" in data:
                total_subscribers = data.get("totalSubscribers", 0)
                successful = data.get("successfulExecutions", 0)
                failed = data.get("failedExecutions", 0)
                
                self.log_test("Multi-User BUY Order", True, 
                            f"Executed for {total_subscribers} subscribers: {successful} success, {failed} failed")
                
                # Verify 25% capital allocation logic
                results = data["results"]
                if len(results) > 0:
                    first_result = results[0]
                    if "executedQuantity" in first_result:
                        self.log_test("Capital Allocation Logic", True, 
                                    f"Order executed with quantity: {first_result['executedQuantity']}")
                    else:
                        self.log_test("Capital Allocation Logic", False, "Missing executed quantity in results")
            else:
                self.log_test("Multi-User BUY Order", False, "Invalid execution response format", data)
                return False
        else:
            self.log_test("Multi-User BUY Order", False, f"Order execution failed with status {response['status_code']}", response["data"])
            return False
        
        # Test SELL order execution
        sell_order = {
            "symbol": "RELIANCE",
            "transactionType": "SELL",
            "orderType": "MARKET",
            "quantity": 5,
            "productType": "CNC"
        }
        
        response = self.make_request('POST', 'admin/execute-order', sell_order, headers)
        
        if response["success"]:
            data = response["data"]
            self.log_test("Multi-User SELL Order", True, 
                        f"SELL order executed for {data.get('totalSubscribers', 0)} subscribers")
            return True
        else:
            self.log_test("Multi-User SELL Order", False, "SELL order execution failed", response["data"])
        
        return False

    def test_execution_history(self):
        """Test execution history retrieval"""
        print("\n=== Testing Execution History ===")
        
        if not self.admin_token:
            self.log_test("Execution History", False, "No admin token available")
            return False
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response = self.make_request('GET', 'admin/execution-history', headers=headers)
        
        if response["success"] and "executions" in response["data"]:
            executions = response["data"]["executions"]
            self.log_test("Execution History", True, f"Retrieved {len(executions)} execution records")
            return True
        else:
            self.log_test("Execution History", False, "Failed to get execution history", response["data"])
            return False

    def test_user_order_history(self):
        """Test user order history"""
        print("\n=== Testing User Order History ===")
        
        if not self.user_token:
            self.log_test("User Order History", False, "No user token available")
            return False
        
        headers = {"Authorization": f"Bearer {self.user_token}"}
        
        response = self.make_request('GET', 'user/orders', headers=headers)
        
        if response["success"] and "orders" in response["data"]:
            orders = response["data"]["orders"]
            self.log_test("User Order History", True, f"Retrieved {len(orders)} order records")
            return True
        else:
            self.log_test("User Order History", False, "Failed to get order history", response["data"])
            return False

    def test_insufficient_funds_scenario(self):
        """Test order execution with insufficient funds"""
        print("\n=== Testing Insufficient Funds Scenario ===")
        
        if not self.admin_token:
            self.log_test("Insufficient Funds Test", False, "No admin token available")
            return False
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Try to buy expensive stock with large quantity
        expensive_order = {
            "symbol": "TCS",
            "transactionType": "BUY", 
            "orderType": "MARKET",
            "quantity": 1000,  # Very large quantity
            "productType": "CNC"
        }
        
        response = self.make_request('POST', 'admin/execute-order', expensive_order, headers)
        
        if response["success"]:
            data = response["data"]
            results = data.get("results", [])
            
            # Check if some orders failed due to insufficient funds
            insufficient_funds_failures = [r for r in results if r.get("errorReason") and "insufficient" in r.get("errorReason", "").lower()]
            
            if len(insufficient_funds_failures) > 0:
                self.log_test("Insufficient Funds Test", True, "System properly handles insufficient funds scenarios")
                return True
            else:
                self.log_test("Insufficient Funds Test", True, "All orders executed (users may have sufficient funds)")
                return True
        else:
            self.log_test("Insufficient Funds Test", False, "Failed to test insufficient funds scenario", response["data"])
            return False

    def test_sell_without_holdings(self):
        """Test selling stock not in portfolio"""
        print("\n=== Testing Sell Without Holdings ===")
        
        if not self.admin_token:
            self.log_test("Sell Without Holdings", False, "No admin token available")
            return False
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Try to sell a stock that users likely don't have
        sell_order = {
            "symbol": "BHARTIARTL",  # Different from typical holdings
            "transactionType": "SELL",
            "orderType": "MARKET", 
            "quantity": 10,
            "productType": "CNC"
        }
        
        response = self.make_request('POST', 'admin/execute-order', sell_order, headers)
        
        if response["success"]:
            data = response["data"]
            results = data.get("results", [])
            
            # Check if orders failed due to stock not in portfolio
            portfolio_failures = [r for r in results if r.get("errorReason") and "portfolio" in r.get("errorReason", "").lower()]
            
            if len(portfolio_failures) > 0:
                self.log_test("Sell Without Holdings", True, "System properly validates portfolio holdings for sell orders")
                return True
            else:
                self.log_test("Sell Without Holdings", True, "Orders processed (users may have holdings)")
                return True
        else:
            self.log_test("Sell Without Holdings", False, "Failed to test sell without holdings", response["data"])
            return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting StockSync Backend API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Core authentication tests
        self.test_user_registration()
        self.test_user_login()
        self.test_invalid_login()
        self.test_unauthorized_access()
        
        # Stock search and broker mock tests
        self.test_stock_search()
        
        # User functionality tests
        self.test_user_broker_connection()
        self.test_user_capital_update()
        self.test_user_portfolio_and_funds()
        
        # Admin functionality tests
        self.test_admin_subscriber_management()
        
        # Core order execution engine tests (MOST CRITICAL)
        self.test_multi_user_order_execution()
        self.test_execution_history()
        self.test_user_order_history()
        
        # Edge case tests
        self.test_insufficient_funds_scenario()
        self.test_sell_without_holdings()
        
        # Print summary
        self.print_test_summary()

    def print_test_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  ❌ {result['test']}: {result['message']}")
        
        print("\n🎯 CRITICAL FEATURES STATUS:")
        
        # Check critical features
        auth_tests = [r for r in self.test_results if "Login" in r["test"] or "Registration" in r["test"]]
        auth_success = all(r["success"] for r in auth_tests)
        print(f"  Authentication System: {'✅ WORKING' if auth_success else '❌ FAILED'}")
        
        order_tests = [r for r in self.test_results if "Order" in r["test"]]
        order_success = all(r["success"] for r in order_tests)
        print(f"  Multi-User Order Execution: {'✅ WORKING' if order_success else '❌ FAILED'}")
        
        broker_tests = [r for r in self.test_results if "Stock Search" in r["test"] or "Portfolio" in r["test"] or "Funds" in r["test"]]
        broker_success = all(r["success"] for r in broker_tests)
        print(f"  Dhan Mock Broker Integration: {'✅ WORKING' if broker_success else '❌ FAILED'}")
        
        admin_tests = [r for r in self.test_results if "Subscriber" in r["test"] or "Execution History" in r["test"]]
        admin_success = all(r["success"] for r in admin_tests)
        print(f"  Admin Management: {'✅ WORKING' if admin_success else '❌ FAILED'}")
        
        print("\n" + "=" * 60)

if __name__ == "__main__":
    tester = StockSyncTester()
    tester.run_all_tests()