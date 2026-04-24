const fs = require('fs');
const content = fs.readFileSync('test_output.log', 'utf16le');
const lines = content.split('\n');
const errorLine = lines.find(l => l.includes('Lỗi khi tạo nhân viên thứ'));
console.log(errorLine);
