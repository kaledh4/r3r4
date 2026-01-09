export async function onRequestGet(context) {
    const { request } = context;

    // Cloudflare Access identity headers
    const email = request.headers.get('cf-access-authenticated-user-email');
    const name = request.headers.get('cf-access-authenticated-user-name') || 'Doctor';

    if (!email) {
        return new Response(JSON.stringify({ authenticated: false, email: 'Doctor' }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    return new Response(JSON.stringify({
        authenticated: true,
        email: email,
        name: name,
        short_name: email.split('@')[0]
    }), {
        headers: { "Content-Type": "application/json" }
    });
}
