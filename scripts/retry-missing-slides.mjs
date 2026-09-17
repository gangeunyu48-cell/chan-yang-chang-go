const endpoint = "https://3000-ifdcryh3vx9exsfhjoqhv-d257db77.sg2.manus.computer/api/trpc/songs.prepareSlides?batch=1";
const ids = [
  120001, 120002, 120004, 120005, 120006, 120007, 120008, 120009, 120010,
  120011, 120012, 120013, 120014, 120015, 120016, 120017, 120018, 120019,
  120020, 120021, 120022, 120023, 120024, 120025, 120026, 120027, 120028,
  120029, 120030, 120031, 120032,
];

async function prepare(id) {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ 0: { json: { id } } }),
      signal: AbortSignal.timeout(300_000),
    });
    const body = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${body.slice(0, 180)}`);
    if (body.includes('"error"')) throw new Error(body.slice(0, 300));
    console.log(`prepared ${id}`);
    return true;
  } catch (error) {
    console.error(`failed ${id}:`, error instanceof Error ? error.message : error);
    return false;
  }
}

let next = 0;
let success = 0;
async function worker() {
  while (next < ids.length) {
    const id = ids[next++];
    if (await prepare(id)) success += 1;
  }
}
await Promise.all([worker(), worker()]);
console.log(`finished: ${success}/${ids.length}`);
if (success !== ids.length) process.exitCode = 1;
