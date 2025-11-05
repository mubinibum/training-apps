// BAD TEST CODE - Will trigger SonarQube findings!
const request = require('supertest');
require('dotenv').config();
const app = require('./app');

// Code Smell: Unused import
const fs = require('fs');
const path = require('path');

// Code Smell: Unused variable
var unusedTestVar = "never used";

// Bug: Using var instead of const/let
var testCounter = 0;

// Code Smell: Magic number
const TIMEOUT = 5000; // Should use config

// Test Suite
describe('Unit Test /', () => {
  
  // Code Smell: Empty test
  it('empty test', () => {
    // No test logic
  });

  // Bug: Missing assertion
  it('should respond with index.html', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    // Code Smell: No more assertions, test is too simple
  });

  // Code Smell: Duplicate test
  it('should respond with index.html again', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });

  // Bug: Test without expect
  it('test without assertion', async () => {
    await request(app).get('/');
    // Missing expect!
  });

  // Code Smell: Too many assertions in one test
  it('kitchen sink test', async () => {
    const response1 = await request(app).get('/');
    expect(response1.status).toBe(200);
    
    const response2 = await request(app).get('/');
    expect(response2.status).toBe(200);
    
    const response3 = await request(app).get('/');
    expect(response3.status).toBe(200);
    
    const response4 = await request(app).get('/');
    expect(response4.status).toBe(200);
    
    const response5 = await request(app).get('/');
    expect(response5.status).toBe(200);
  });

  // Code Smell: Console.log in test
  it('test with console.log', async () => {
    console.log("Starting test...");
    const response = await request(app).get('/');
    console.log("Response received:", response.status);
    expect(response.status).toBe(200);
    console.log("Test completed");
  });

  // Bug: Using == instead of ===
  it('test with wrong comparison', async () => {
    const response = await request(app).get('/');
    expect(response.status == 200).toBe(true); // Should use ===
  });

  // Code Smell: Commented out test
  // it('disabled test', async () => {
  //   const response = await request(app).get('/');
  //   expect(response.status).toBe(200);
  // });

  // Bug: Empty catch block
  it('test with empty catch', async () => {
    try {
      const response = await request(app).get('/invalid');
      expect(response.status).toBe(404);
    } catch (error) {
      // Empty catch block - Code smell!
    }
  });

  // Code Smell: Hardcoded values
  it('test with hardcoded values', async () => {
    const url = 'http://localhost:3000'; // Hardcoded URL
    const expectedStatus = 200; // Hardcoded status
    const response = await request(app).get('/');
    expect(response.status).toBe(expectedStatus);
  });

  // Bug: Async test without await
  it('missing await', async () => {
    request(app).get('/'); // Missing await!
    expect(true).toBe(true); // Meaningless assertion
  });

  // Code Smell: Test with side effects
  it('test with side effects', async () => {
    testCounter++; // Modifying global state
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    testCounter++; // More side effects
  });

  // Code Smell: Duplicate code in tests
  it('duplicate test logic 1', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.type).toBe('text/html');
  });

  it('duplicate test logic 2', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.type).toBe('text/html');
  });

  // Bug: Test that always passes
  it('test that always passes', () => {
    expect(true).toBe(true); // Useless test
  });

  // Code Smell: Too complex test
  it('overly complex test', async () => {
    for (var i = 0; i < 3; i++) {
      if (i > 0) {
        const response = await request(app).get('/');
        if (response.status === 200) {
          expect(response.status).toBe(200);
        } else {
          expect(response.status).not.toBe(200);
        }
      }
    }
  });

  // Bug: Using var in loop
  it('test with var in loop', async () => {
    for (var i = 0; i < 5; i++) {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
    }
  });

  // Code Smell: Magic numbers
  it('test with magic numbers', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200); // Magic number
    expect(response.text.length).toBeGreaterThan(100); // Magic number
  });

  // Bug: Nested describes (too deep)
  describe('nested describe', () => {
    describe('deeply nested', () => {
      describe('too deep', () => {
        it('deeply nested test', async () => {
          const response = await request(app).get('/');
          expect(response.status).toBe(200);
        });
      });
    });
  });

  // Code Smell: Test name not descriptive
  it('test1', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });

  // Bug: Callback instead of async/await
  it('test with callback', (done) => {
    request(app)
      .get('/')
      .end((err, res) => {
        expect(res.status).toBe(200);
        done();
      });
  });

  // Code Smell: Skipped test
  it.skip('skipped test', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });

  // Code Smell: Only this test runs (forgot to remove .only)
  // it.only('only this test', async () => {
  //   const response = await request(app).get('/');
  //   expect(response.status).toBe(200);
  // });

});

// Code Smell: Dead code after describe
function unusedTestHelper() {
  return "This is never called";
}

// Code Smell: Global variable in test file
global.testGlobal = "Should not use globals";

// Bug: Duplicate describe
describe('Unit Test /', () => {
  it('duplicate describe block', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });
});

// Code Smell: Code after all tests
var afterTests = "Code after tests";
console.log(afterTests);