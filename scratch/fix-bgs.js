const fs = require('fs');

function replaceFile(path, replaces) {
  let content = fs.readFileSync(path, 'utf8');
  for (const [search, replace] of replaces) {
    content = content.split(search).join(replace);
  }
  fs.writeFileSync(path, content);
}

replaceFile('app/page.tsx', [
  ['className="min-h-screen bg-slate-50"', 'className="min-h-screen bg-slate-950"'],
  ['bg-white/80 backdrop-blur-md border-b border-slate-200', 'bg-slate-950/80 backdrop-blur-md border-b border-slate-800'],
  ['text-slate-900 tracking-tight', 'text-slate-100 tracking-tight'],
  ['text-slate-600 hover:text-slate-900', 'text-slate-300 hover:text-white'],
  ['text-slate-600 mb-8', 'text-slate-400 mb-8'],
  ['bg-white p-8 rounded-2xl shadow-sm border border-slate-100', 'bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-800'],
  ['text-slate-600 leading-relaxed', 'text-slate-400 leading-relaxed'],
  ['border-t border-slate-200', 'border-t border-slate-800'],
  ['text-slate-500 hover:text-indigo-600', 'text-slate-400 hover:text-indigo-400']
]);

const authReplaces = [
  ['bg-slate-50', 'bg-slate-950'],
  ['bg-white', 'bg-slate-900'],
  ['border-slate-100', 'border-slate-800'],
  ['text-slate-800', 'text-slate-100'],
  ['text-slate-500', 'text-slate-400'],
  ['text-slate-600', 'text-slate-300'],
  ['border-slate-200', 'border-slate-700'],
  ['bg-slate-50', 'bg-slate-900'] // some duplicate handling
];

replaceFile('app/auth/login/page.tsx', authReplaces);
replaceFile('app/auth/register/page.tsx', authReplaces);

console.log("Done");
