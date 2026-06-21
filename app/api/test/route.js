export const runtime = 'edge';

export async function GET(request) {
  return new Response(JSON.stringify({ status: "ok", message: "Pages Functions are working correctly!" }), {
    status: 200,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
