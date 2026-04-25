const fs = require('fs');
const content = fs.readFileSync('test_output.log', 'utf16le');
const lines = content.split('\n').filter(l => l.includes('Test Limit') || l.includes('Error') || l.includes('Lỗi') || l.includes('FAILED') || l.includes('S-PLAN-LIMITS'));
fs.writeFileSync('clean_log.txt', lines.join('\n'), 'utf8');
