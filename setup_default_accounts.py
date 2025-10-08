#!/usr/bin/env python3
"""
Setup default accounts for StockSync testing
"""

from pymongo import MongoClient
from uuid import uuid4
import os

def setup_default_accounts():
    client = MongoClient(os.environ.get('MONGO_URL', 'mongodb://localhost:27017'))
    db = client[os.environ.get('DB_NAME', 'stocksync')]
    
    # Clear existing users
    db.users.delete_many({})
    
    # Create admin account
    admin_id = str(uuid4())
    admin_user = {
        "id": admin_id,
        "email": "admin@stocksync.com",
        "password": "admin123",
        "name": "Admin User",
        "role": "admin",
        "subscriptionStatus": "active",
        "brokerConnections": [],
        "maxCapital": 1000000,
        "token": f"token_{admin_id}",
        "createdAt": "2024-01-01T00:00:00Z"
    }
    
    # Create sample user account
    user_id = str(uuid4())
    sample_user = {
        "id": user_id,
        "email": "john@example.com",
        "password": "user123",
        "name": "John Doe",
        "role": "user",
        "subscriptionStatus": "active",
        "brokerConnections": [],
        "maxCapital": 100000,
        "token": f"token_{user_id}",
        "createdAt": "2024-01-01T00:00:00Z"
    }
    
    # Insert users
    db.users.insert_many([admin_user, sample_user])
    
    print("✅ Default accounts created successfully:")
    print(f"   Admin: admin@stocksync.com / admin123 (Role: admin)")
    print(f"   User: john@example.com / user123 (Role: user)")
    
    # Verify creation
    users = list(db.users.find({}, {'password': 0, 'token': 0}))
    print(f"\n📊 Total users in database: {len(users)}")
    for user in users:
        print(f"   {user['email']} - {user['role']} - {user['subscriptionStatus']}")

if __name__ == "__main__":
    setup_default_accounts()