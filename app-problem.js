// BAD CODE - Will trigger MANY SonarQube findings!
const express = require('express')
const app = express()
const path = require('path')
require('dotenv').config();
const fs = require('fs')
const exec = require('child_process').exec;

// Security Issue: X-Powered-By not disabled (default Express header)
// app.disable('x-powered-by') // COMMENTED OUT - Security vulnerability!

// Import Middleware
const logger = require('./middleware/logger')
app.use(logger)

// Security Issue: No input validation
// Security Issue: No rate limiting
// Security Issue: No helmet for security headers

// Code Smell: Unused variable
var unusedVariable = "This is never used";
var anotherUnusedVar = 123;

// Code Smell: Duplicated code block
function duplicatedFunction1() {
    console.log("Starting process");
    var x = 10;
    var y = 20;
    var result = x + y;
    console.log("Process completed");
    return result;
}

function duplicatedFunction2() {
    console.log("Starting process");
    var x = 10;
    var y = 20;
    var result = x + y;
    console.log("Process completed");
    return result;
}

// Bug: Using var instead of const/let
var port = process.env.APP_PORT || 3000;

// Code Smell: Magic numbers
if (port == 3000) {  // Bug: Using == instead of ===
    console.log("Running on default port");
}

// Dashboard
app.use('/', express.static(path.join(__dirname, 'public')));

// Security Vulnerability: Command Injection
app.get('/execute', (req, res) => {
    // CRITICAL: Command injection vulnerability!
    const command = req.query.cmd;
    exec(command, (error, stdout, stderr) => {
        res.send(stdout);
    });
});

// Security Vulnerability: Path Traversal
app.get('/read', (req, res) => {
    // CRITICAL: Path traversal vulnerability!
    const filename = req.query.file;
    fs.readFile(filename, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading file');
            return;
        }
        res.send(data);
    });
});

// Bug: Callback in async function (unnecessary)
app.get('/api/data', async (req, res) => {
    // Code Smell: Using callback in async function
    setTimeout(function() {
        res.json({ message: 'Data fetched' });
    }, 1000);
});

// Code Smell: Too many parameters
function complexFunction(param1, param2, param3, param4, param5, param6, param7) {
    return param1 + param2 + param3 + param4 + param5 + param6 + param7;
}

// Code Smell: Cognitive complexity too high
function complexLogic(a, b, c) {
    if (a > 0) {
        if (b > 0) {
            if (c > 0) {
                for (var i = 0; i < 10; i++) {
                    if (i % 2 == 0) {
                        if (i > 5) {
                            console.log("Complex");
                        }
                    }
                }
            }
        }
    }
    return a + b + c;
}

// Bug: Empty catch block
try {
    JSON.parse("invalid json");
} catch (e) {
    // Code Smell: Empty catch block
}

// Code Smell: Console.log in production code
console.log("Server starting...");
console.log("Environment:", process.env.NODE_ENV);

// Bug: Using eval (Security vulnerability!)
app.get('/calc', (req, res) => {
    const expression = req.query.expr;
    // CRITICAL: eval is dangerous!
    const result = eval(expression);
    res.json({ result: result });
});

// Code Smell: Function with too many lines
function tooManyLines() {
    var line1 = 1;
    var line2 = 2;
    var line3 = 3;
    var line4 = 4;
    var line5 = 5;
    var line6 = 6;
    var line7 = 7;
    var line8 = 8;
    var line9 = 9;
    var line10 = 10;
    var line11 = 11;
    var line12 = 12;
    var line13 = 13;
    var line14 = 14;
    var line15 = 15;
    var line16 = 16;
    var line17 = 17;
    var line18 = 18;
    var line19 = 19;
    var line20 = 20;
    console.log("Too many lines!");
    return line1 + line2 + line3 + line4 + line5;
}

// Bug: No error handling
app.get('/unsafe', (req, res) => {
    const data = JSON.parse(req.query.data); // Can throw error!
    res.json(data);
});

// Security: Hardcoded credentials
const API_KEY = "sk_live_1234567890abcdef"; // Security hotspot!
const DATABASE_PASSWORD = "admin123"; // Security hotspot!

// Code Smell: Dead code
function neverCalled() {
    console.log("This function is never called");
    return "dead code";
}

// Bug: Using deprecated method
app.get('/old', (req, res) => {
    // Using exists (deprecated)
    fs.exists('/tmp/file', (exists) => {
        res.send(exists ? 'exists' : 'not exists');
    });
});

// Code Smell: Identical expressions
if (port === port) {
    console.log("This is always true");
}

// Bug: Assignment in condition
var status = 200;
if (status = 404) {  // Should be ===
    console.log("Error");
}

// Code Smell: Switch without default
switch (port) {
    case 3000:
        console.log("Dev");
        break;
    case 8080:
        console.log("Prod");
        break;
    // Missing default case
}

// Security: Insecure random
function generateToken() {
    // Security issue: Math.random is not cryptographically secure
    return Math.random().toString(36).substring(2);
}

// Code Smell: Duplicate string literals
console.log("Starting application");
console.log("Starting application");
console.log("Starting application");

// Bug: Promise without catch
app.get('/promise', (req, res) => {
    Promise.resolve()
        .then(() => {
            res.send('Done');
        }); // Missing .catch()
});

// Code Smell: Too many nested callbacks (callback hell)
app.get('/nested', (req, res) => {
    setTimeout(() => {
        setTimeout(() => {
            setTimeout(() => {
                setTimeout(() => {
                    res.send('Very nested!');
                }, 100);
            }, 100);
        }, 100);
    }, 100);
});

// Bug: Incorrect string comparison
var input = "123";
if (input == 123) {  // Type coercion bug
    console.log("Matched");
}

// Code Smell: Function should be const
function helperFunction() {
    return "helper";
}

// Security: SQL Injection vulnerability (example)
app.get('/user', (req, res) => {
    const userId = req.query.id;
    // Simulated SQL injection vulnerability
    const query = "SELECT * FROM users WHERE id = " + userId; // UNSAFE!
    res.json({ query: query });
});

// Code Smell: Commented out code
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// function oldFeature() {
//     console.log("Old feature");
// }

// Bug: No return statement
function shouldReturnValue() {
    var value = 42;
    // Missing return!
}

// Start server with potential issues
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
  console.log("Warning: Running with security vulnerabilities!") // Code smell
  console.log("Warning: Multiple code smells detected!") // Code smell
})

// Export
module.exports = app

// Code Smell: Code after module.exports
var afterExport = "This code is after export";
console.log(afterExport);