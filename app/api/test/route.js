export const dynamic = 'force-dynamic';
export async function GET(request) {
  let hasAsyncLocalStorage = false;
  let hasProcess = false;
  try {
    const asyncHooks = await import('node:async_hooks');
    hasAsyncLocalStorage = !!asyncHooks.AsyncLocalStorage;
  } catch (e) {}

  try {
    hasProcess = typeof process !== 'undefined';
  } catch (e) {}

  return new Response(JSON.stringify({ 
    status: "ok", 
    hasAsyncLocalStorage, 
    hasProcess,
    globalKeys: Object.keys(globalThis).filter(k => k.toLowerCase().includes('async'))
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
