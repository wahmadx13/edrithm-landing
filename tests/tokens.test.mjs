import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { themes } from '../design-system/tangerine/tokens';
it('keeps distinct light and dark surfaces',()=>{expect(themes.light.color.background.page).not.toBe(themes.dark.color.background.page)});
it('keeps the imported token source pinned to its recorded provenance',()=>{
  const dir = new URL('../design-system/tangerine/', import.meta.url);
  const provenance = JSON.parse(readFileSync(new URL('provenance.json', dir), 'utf8'));
  for (const name of ['tokens.json', 'tokens.resolved.json', 'tokens.ts', 'tokens.css']) {
    expect(createHash('sha256').update(readFileSync(new URL(name, dir))).digest('hex')).toBe(provenance.files[name]);
  }
});
