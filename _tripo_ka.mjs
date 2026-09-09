import 'dotenv/config';
import { Client, handle_file } from '@gradio/client';
import fs from 'fs';
const TOKEN = process.env.HF_API_TOKEN;
const t0 = Date.now(); const el = () => ((Date.now()-t0)/1000).toFixed(1)+'s';
const ka = setInterval(()=>{}, 1000);
const log = (m) => { fs.appendFileSync('/tmp/tripo.log', m+'\n'); };
fs.writeFileSync('/tmp/tripo.log','');
try {
  const ir = await fetch('https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=512&q=80');
  fs.writeFileSync('/tmp/tripo-test.jpg', Buffer.from(await ir.arrayBuffer()));
  const app = await Client.connect('stabilityai/TripoSR', { token: TOKEN });
  log(`connected +${el()}`);
  const pre = await app.predict('/preprocess', [handle_file('/tmp/tripo-test.jpg'), true, 0.85]);
  log(`preprocessed +${el()}`);
  const job = app.submit('/generate', [pre.data[0], 256]);
  let result;
  for await (const msg of job) {
    log(`  [gen] type=${msg.type} stage=${msg.stage||''} pos=${msg.position??''} +${el()}`);
    if (msg.type === 'data') result = msg.data;
  }
  if (result) {
    const glb = result[1];
    const gr = await fetch(glb.url || glb.path, { headers: { Authorization: `Bearer ${TOKEN}` } });
    const b = Buffer.from(await gr.arrayBuffer());
    fs.writeFileSync('public/samples/preview-sample.glb', b);
    log(`SAVED ${b.length} bytes magic="${b.subarray(0,4).toString('ascii')}" TOTAL=${el()}`);
  } else { log(`no result +${el()}`); }
} catch (e) { log(`FAILED +${el()}: ${e.message}`); }
finally { clearInterval(ka); }
