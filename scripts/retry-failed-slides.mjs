const endpoint = "https://3000-ifdcryh3vx9exsfhjoqhv-d257db77.sg2.manus.computer/api/trpc/songs.prepareSlides?batch=1";
const ids = [120002, 120023];
for (const id of ids) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ 0: { json: { id } } }),
    signal: AbortSignal.timeout(300_000),
  });
  const body = await response.text();
  console.log(id, response.status, body.slice(0, 180));
  if (!response.ok) process.exitCode = 1;
}
