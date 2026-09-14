const endpoint = "https://3000-ifdcryh3vx9exsfhjoqhv-d257db77.sg2.manus.computer/api/trpc/songs.prepareManySlides?batch=1";
const ids = Array.from({ length: 462 }, (_, index) => 60001 + index);
const batches = [];
for (let index = 0; index < ids.length; index += 10) batches.push(ids.slice(index, index + 10));

async function runBatch(batch) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ 0: { json: { ids: batch } } }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

let completed = 0;
for (let index = 0; index < batches.length; index += 2) {
  const group = batches.slice(index, index + 2);
  await Promise.all(group.map(runBatch));
  completed += group.length;
  console.log(`processed ${Math.min(completed * 10, ids.length)} of ${ids.length} songs`);
}
console.log("finished");
