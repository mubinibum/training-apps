const request = require('supertest');
const mysql = require('mysql');
require('dotenv').config();

const connection = require('../middleware/db_connect');
const app = require('../app'); // Replace with the path to your application file

describe('Unit Test /', () => {
  it('should respond with index.html', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });
});