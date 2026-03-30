const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Mocking environment variables from .env.local
const envFile = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envFile, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const PAYU_KEY = env.PAYU_KEY || 'gtKFFx';
const PAYU_SALT = env.PAYU_SALT || '4R38IvwiV57FwVpsgOvTXBdLE4tHUXFW';

function generateHash(data) {
    const { amount, txnid, productinfo, firstname, email, udf1, udf2 } = data;
    // key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
    const text = `${PAYU_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|||||||||${PAYU_SALT}`;
    console.log('Generating Hash for sequence:');
    console.log(text);
    
    const hash = crypto.createHash('sha512').update(text).digest('hex');
    return hash;
}

const testData = {
    amount: '500',
    txnid: 'txn_test_' + Date.now(),
    productinfo: 'Test 500 Plan - LeadGorilla',
    firstname: 'Gorilla Test',
    email: 'test@leadgorilla.com',
    udf1: 'test_user_uid',
    udf2: 'Starter'
};

const resultHash = generateHash(testData);
console.log('\n--- RESULT ---');
console.log('Amount: ' + testData.amount);
console.log('Hash:   ' + resultHash);
console.log('--- END ---');
