import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'

test('the selected fifth theme is explicit and maps the stable terminal contract',async()=>{
 const [main,css,visual]=await Promise.all([
  readFile(new URL('../src/main.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/style.css',import.meta.url),'utf8'),
  readFile(new URL('../doc/visual.md',import.meta.url),'utf8')
 ])
 assert.match(main,/data-spatial-ui-theme="05-terminal"/)
 for(const token of ['#030f0c','#071811','#10291e','#d4f0d5','#50936f','#91efac','#69b686'])assert.ok(css.includes(token),`missing terminal token ${token}`)
 for(const state of ['.mm-header','.mm-objective','.mm-controls','.mm-primary','.mm-dialog','.mm-records','.mm-zoom','.mm-error'])assert.match(css,new RegExp(`05-terminal"\\] ${state.replace('.','\\.')}`),`theme does not map ${state}`)
 assert.match(css,/--mm-terminal-reading:system-ui/)
 assert.match(css,/\.mm-zoom p\{font-family:var\(--mm-terminal-reading\)/)
 assert.match(visual,/第五套 `05-terminal`/)
})
