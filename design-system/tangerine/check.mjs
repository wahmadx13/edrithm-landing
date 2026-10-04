/** Regression checks for the token compiler, isolated from the canonical source. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const dir=path.dirname(fileURLToPath(import.meta.url));
const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'edrithm-tangerine-check-'));
const original=JSON.parse(fs.readFileSync(path.join(dir,'tokens.json'),'utf8'));
fs.copyFileSync(path.join(dir,'build.mjs'),path.join(fixture,'build.mjs'));
const run=(args=[])=>spawnSync(process.execPath,[path.join(fixture,'build.mjs'),...args],{encoding:'utf8'});
const write=s=>fs.writeFileSync(path.join(fixture,'tokens.json'),JSON.stringify(s));
const fails=(label,mutate,message)=>{
 const source=structuredClone(original);mutate(source);write(source);
 const result=run();assert.notEqual(result.status,0,label);assert.match(result.stderr,message,label);return label;
};
const checks=[];
try {
 write(original);assert.equal(run().status,0);assert.equal(run(['--check']).status,0);checks.push('Valid source generates and verifies');
 checks.push(fails('Missing aliases rejected',s=>s.components.button.radius.$value='{radius.missing}',/Unknown token/));
 checks.push(fails('Alias cycles rejected',s=>s.foundation.radius.control.$value='{component.button.radius}',/Cyclic token/));
 checks.push(fails('Wrong alias types rejected',s=>s.components.button.radius.$value='{color.brand.solid}',/Alias type mismatch/));
 checks.push(fails('Wrong numeric values rejected',s=>s.foundation.space.sm.$value='eight',/Invalid numeric token/));
 checks.push(fails('Theme key mismatch rejected',s=>delete s.modes.dark.color.chart.series6,/Theme token keys differ/));
 checks.push(fails('Unreadable text rejected',s=>s.modes.light.color.text.primary.$value='#ffffff',/Contrast failures/));
 write(original);assert.equal(run().status,0);
 fs.appendFileSync(path.join(fixture,'tokens.css'),'/* accidental edit */');
 const stale=run(['--check']);assert.notEqual(stale.status,0);assert.match(stale.stderr,/Stale generated file/);checks.push('Edited generated output rejected');
 console.log(checks.map(s=>'PASS '+s).join('\n'));
} finally {
 // Only remove this invocation's verified temporary fixture directory.
 const resolved=path.resolve(fixture), parent=path.resolve(os.tmpdir());
 if(path.dirname(resolved)!==parent||!path.basename(resolved).startsWith('edrithm-tangerine-check-')) throw Error('Unexpected fixture path');
 fs.rmSync(resolved,{recursive:true,force:true});
}
