import requests
import sys
import json
from datetime import datetime

class VineBarrelAPITester:
    def __init__(self, base_url="https://payment-ops-5.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=False):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url)
            elif method == 'POST':
                response = self.session.post(url, json=data)
            elif method == 'PUT':
                response = self.session.put(url, json=data)
            elif method == 'DELETE':
                response = self.session.delete(url)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.text[:200]}")
                except:
                    pass
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health"""
        return self.run_test("API Health Check", "GET", "", 200)

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@vineandbarrel.com", "password": "VineBarrel2026!"}
        )
        if success:
            print(f"   Admin user: {response.get('name', 'Unknown')} ({response.get('role', 'Unknown')})")
        return success

    def test_user_registration(self):
        """Test user registration"""
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@example.com"
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={"email": test_email, "password": "TestPass123!", "name": "Test User"}
        )
        if success:
            print(f"   Created user: {response.get('name', 'Unknown')} ({response.get('email', 'Unknown')})")
        return success

    def test_auth_me(self):
        """Test auth/me endpoint"""
        return self.run_test("Get Current User", "GET", "auth/me", 200)

    def test_logout(self):
        """Test logout"""
        return self.run_test("Logout", "POST", "auth/logout", 200)

    def test_get_kits(self):
        """Test get tasting kits"""
        success, response = self.run_test("Get Tasting Kits", "GET", "kits", 200)
        if success:
            print(f"   Found {len(response)} kits")
            if response:
                print(f"   Sample kit: {response[0].get('name', 'Unknown')}")
        return success

    def test_get_events(self):
        """Test get events"""
        success, response = self.run_test("Get Events", "GET", "events", 200)
        if success:
            print(f"   Found {len(response)} events")
            if response:
                print(f"   Sample event: {response[0].get('title', 'Unknown')}")
        return success

    def test_get_packs(self):
        """Test get packs"""
        success, response = self.run_test("Get Packs", "GET", "packs", 200)
        if success:
            print(f"   Found {len(response)} packs")
            if response:
                print(f"   Sample pack: {response[0].get('name', 'Unknown')}")
        return success

    def test_membership_plans(self):
        """Test get membership plans"""
        success, response = self.run_test("Get Membership Plans", "GET", "membership/plans", 200)
        if success:
            print(f"   Found {len(response)} plans")
            for plan in response:
                print(f"   Plan: {plan.get('name', 'Unknown')} - ${plan.get('price', 0)}")
        return success

    def test_partner_inquiry(self):
        """Test partner inquiry submission"""
        inquiry_data = {
            "business_name": "Test Business",
            "business_type": "Restaurant",
            "contact_name": "Test Contact",
            "email": "test@business.com",
            "phone": "555-1234",
            "description": "Test inquiry",
            "interests": ["Wine Tastings", "Events"]
        }
        success, response = self.run_test(
            "Partner Inquiry Submission",
            "POST",
            "partner-inquiry",
            200,
            data=inquiry_data
        )
        if success:
            print(f"   Inquiry ID: {response.get('id', 'Unknown')}")
        return success

    def test_admin_stats(self):
        """Test admin stats (requires admin login)"""
        return self.run_test("Admin Stats", "GET", "admin/stats", 200)

    def test_admin_users(self):
        """Test admin users list (requires admin login)"""
        success, response = self.run_test("Admin Users List", "GET", "admin/users", 200)
        if success:
            print(f"   Found {len(response)} users")
        return success

    def test_journal_endpoints(self):
        """Test journal endpoints (requires auth)"""
        # Test get journal
        success1, response1 = self.run_test("Get Journal", "GET", "journal", 200)
        if success1:
            print(f"   Found {len(response1)} journal entries")
        
        # Test create journal entry
        entry_data = {
            "spirit_name": "Test Wine",
            "vintage": "2020",
            "region": "Test Region",
            "body": "Full",
            "tannins": "High",
            "finish": "Long",
            "notes": "Test tasting notes"
        }
        success2, response2 = self.run_test(
            "Create Journal Entry",
            "POST",
            "journal",
            200,
            data=entry_data
        )
        if success2:
            print(f"   Created entry ID: {response2.get('id', 'Unknown')}")
        
        return success1 and success2

def main():
    print("🍷 Starting Vine & Barrel API Tests...")
    tester = VineBarrelAPITester()
    
    # Test basic endpoints (no auth required)
    print("\n" + "="*50)
    print("TESTING PUBLIC ENDPOINTS")
    print("="*50)
    
    tester.test_health_check()
    tester.test_get_kits()
    tester.test_get_events()
    tester.test_get_packs()
    tester.test_membership_plans()
    tester.test_partner_inquiry()
    
    # Test auth flow
    print("\n" + "="*50)
    print("TESTING AUTHENTICATION")
    print("="*50)
    
    # Test user registration
    tester.test_user_registration()
    
    # Test admin login
    if tester.test_admin_login():
        # Test authenticated endpoints
        print("\n" + "="*50)
        print("TESTING AUTHENTICATED ENDPOINTS")
        print("="*50)
        
        tester.test_auth_me()
        tester.test_journal_endpoints()
        tester.test_admin_stats()
        tester.test_admin_users()
        
        # Test logout
        tester.test_logout()
    
    # Print final results
    print("\n" + "="*50)
    print("TEST RESULTS")
    print("="*50)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())