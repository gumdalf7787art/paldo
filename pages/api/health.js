
export default function handler(req) {
  return new Response(
    JSON.stringify({
      status: 'ok',
      message: 'Pages Router API works!'
    }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    }
  );
}
