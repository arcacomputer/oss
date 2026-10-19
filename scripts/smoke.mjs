import assert from 'node:assert/strict';
const base=(process.env.SMOKE_BASE_URL||'http://127.0.0.1:8787').replace(/\/$/,'');const get=(p)=>fetch(base+p,{redirect:'manual'});
for(const path of ['/','/activity.json','/github-repositories.json','/openclaw-prs.json','/oss.json','/llms.txt','/robots.txt','/sitemap.xml','/og.png']){const r=await get(path);assert.equal(r.status,200,`${path} must return 200`);}
const root=await get('/');assert.match(root.headers.get('cache-control')||'',/no-transform/);assert.ok(root.headers.get('strict-transport-security'));
const missing=await get('/definitely-missing');assert.equal(missing.status,404);assert.match(await missing.text(),/404 \/ PAGE NOT FOUND/);
console.log(`Runtime smoke passed at ${base}: page, public evidence, metadata, no-transform, HSTS, and true 404.`);
