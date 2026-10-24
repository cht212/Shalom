import sharp from 'sharp';
const source='public/branding/emblema-shalom.png';
for(const size of [180,192,512]){
 await sharp(source).resize(size,size,{fit:'contain',background:'#ffffff'}).png().toFile(`public/branding/pwa-${size}.png`);
 if(size===180)continue;
 // Leave a safe margin around the original emblem for circular launcher masks.
 const inner=Math.floor(size*.7);
 const emblem=await sharp(source).resize(inner,inner,{fit:'contain',background:'#ffffff'}).png().toBuffer();
 await sharp({create:{width:size,height:size,channels:4,background:'#ffffff'}}).composite([{input:emblem,gravity:'centre'}]).png().toFile(`public/branding/pwa-maskable-${size}.png`);
}
