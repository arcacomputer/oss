import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
const root=new URL('..',import.meta.url).pathname,dist=join(root,'dist');const html=readFileSync(join(dist,'index.html'),'utf8');
for(const marker of ['Arca OSS — Tools, contributions &amp; open-source work','Open source <span>at Arca.</span>','OrthoVoxel Studio demo view','Browse software','Software we make','Projects we contribute to','In progress','Past contributions','Public records'])assert.match(html,new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
for(const asset of ['activity.json','github-repositories.json','openclaw-prs.json','oss.json','llms.txt','robots.txt','sitemap.xml','og.png','icon.svg','orthovoxel/model.webp','orthovoxel/front.png','orthovoxel/right.png','orthovoxel/top.png','orthovoxel/LICENSE.txt','404.html','_headers'])assert.ok(existsSync(join(dist,asset)),`${asset} must be built`);
assert.match(readFileSync(join(dist,'robots.txt'),'utf8'),/Sitemap: https:\/\/oss\.arcabot\.ai\/sitemap\.xml/);
assert.match(readFileSync(join(dist,'sitemap.xml'),'utf8'),/<loc>https:\/\/oss\.arcabot\.ai<\/loc>/);
console.log('Built-site contract passed: page, evidence feeds, metadata assets, sitemap, and 404.');
