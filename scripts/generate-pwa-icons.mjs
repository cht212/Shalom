import sharp from 'sharp';
const source='public/branding/shalom-app-icon.png';
await sharp(source).png().toFile('public/branding/shalom-2026-icon.png');
for(const size of [180,192,512]){
 await sharp(source).resize(size,size,{fit:'cover'}).png().toFile(`public/branding/shalom-2026-${size}.png`);
 if(size===180)continue;
 // Leave a safe margin around the original emblem for circular launcher masks.
 const inner=Math.floor(size*.82);
 const emblem=await sharp(source).resize(inner,inner,{fit:'cover'}).png().toBuffer();
 await sharp({create:{width:size,height:size,channels:4,background:'#0867d8'}}).composite([{input:emblem,gravity:'centre'}]).png().toFile(`public/branding/shalom-2026-maskable-${size}.png`);
}
