/**
 * Test Address Validation API
 * Run: node test-address-validation.js
 */

const API_URL = process.env.API_URL || "http://localhost:3000/api/v1";
const TEST_TOKEN = process.env.TEST_TOKEN || "YOUR_AUTH_TOKEN_HERE";

// Test cases
const testCases = [
  {
    name: "Valid Address - Noida",
    data: {
      name: "john doe",
      phone: "9876543210",
      pincode: "201301",
      house: "c-104 maxblis white house",
      street: "sector 137 greater noida",
      landmark: "near metro station",
      city: "Greater Noida",
      state: "Uttar Pradesh",
    },
    expectedSuccess: true,
  },
  {
    name: "Invalid Phone",
    data: {
      name: "Test User",
      phone: "1234567890", // Invalid - doesn't start with 6-9
      pincode: "201301",
      house: "A-101",
      street: "Test Street",
      city: "Test City",
      state: "Test State",
    },
    expectedSuccess: false,
  },
  {
    name: "Invalid PIN Code",
    data: {
      name: "Test User",
      phone: "9876543210",
      pincode: "12345", // Invalid - only 5 digits
      house: "A-101",
      street: "Test Street",
      city: "Test City",
      state: "Test State",
    },
    expectedSuccess: false,
  },
  {
    name: "Missing Required Fields",
    data: {
      name: "Test User",
      phone: "9876543210",
      // Missing pincode, house, street
      city: "Test City",
      state: "Test State",
    },
    expectedSuccess: false,
  },
];

// Test PIN code check (public endpoint)
async function testPincodeCheck() {
  console.log("\n🔍 Testing PIN Code Check (Public Endpoint)");
  console.log("=".repeat(60));

  const pincodes = ["201301", "110001", "999999"];

  for (const pincode of pincodes) {
    try {
      const response = await fetch(
        `${API_URL}/addresses/check-pincode/${pincode}`,
      );
      const data = await response.json();

      console.log(`\nPIN: ${pincode}`);
      console.log(`Status: ${response.status}`);
      console.log(`Success: ${data.success}`);
      console.log(`Serviceable: ${data.serviceable}`);
      console.log(`COD Available: ${data.codAvailable}`);

      if (data.success) {
        console.log("✅ PASS");
      } else {
        console.log("❌ FAIL:", data.message);
      }
    } catch (error) {
      console.error(`❌ ERROR testing PIN ${pincode}:`, error.message);
    }
  }
}

// Test address validation (protected endpoint)
async function testAddressValidation() {
  console.log("\n📝 Testing Address Validation (Protected Endpoint)");
  console.log("=".repeat(60));

  if (TEST_TOKEN === "YOUR_AUTH_TOKEN_HERE") {
    console.log(
      "⚠️  WARNING: Using placeholder token. Set TEST_TOKEN env variable.",
    );
    console.log("⚠️  Validation tests will be skipped.");
    return;
  }

  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log("-".repeat(60));

    try {
      const response = await fetch(`${API_URL}/addresses/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TEST_TOKEN}`,
        },
        body: JSON.stringify(testCase.data),
      });

      const data = await response.json();

      console.log(`Status: ${response.status}`);
      console.log(`Success: ${data.success}`);

      if (data.success) {
        console.log("✅ Cleaned Address:");
        console.log(JSON.stringify(data.cleanedAddress, null, 2));
        console.log(`Serviceable: ${data.serviceable}`);
        console.log(`COD Available: ${data.codAvailable}`);

        if (data.warnings?.length > 0) {
          console.log("⚠️  Warnings:", data.warnings);
        }

        if (testCase.expectedSuccess) {
          console.log("✅ PASS: Expected success, got success");
        } else {
          console.log("❌ FAIL: Expected failure, got success");
        }
      } else {
        console.log("❌ Errors:", data.errors || [data.message]);

        if (!testCase.expectedSuccess) {
          console.log("✅ PASS: Expected failure, got failure");
        } else {
          console.log("❌ FAIL: Expected success, got failure");
        }
      }
    } catch (error) {
      console.error("❌ ERROR:", error.message);
    }
  }
}

// Run tests
async function runTests() {
  console.log("🧪 Address Validation API Tests");
  console.log("=".repeat(60));
  console.log(`API URL: ${API_URL}`);
  console.log(`Token: ${TEST_TOKEN.substring(0, 10)}...`);

  await testPincodeCheck();
  await testAddressValidation();

  console.log("\n" + "=".repeat(60));
  console.log("✅ Tests Complete");
}

// Execute
runTests().catch(console.error);
