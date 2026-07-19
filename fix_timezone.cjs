const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist) {
  let files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      if (file.endsWith('.jsx') || file.endsWith('.js')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
}

const files = walkSync('d:/STUDY/Ky_8/SWP_391/SWP_391/FE_ScholarTrend/src');
let updated = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('const date = new Date(value);') && content.includes('function format')) {
    const replacement = `let dateString = value;
  if (typeof dateString === 'string' && !dateString.endsWith('Z') && !dateString.match(/[+-]\\d{2}:?\\d{2}$/)) {
    dateString += 'Z';
  }
  const date = new Date(dateString);`;
    content = content.replace('const date = new Date(value);', replacement);
    fs.writeFileSync(file, content);
    updated++;
    console.log('Updated', file);
  }
});
console.log('Total files updated:', updated);
