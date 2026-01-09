export async function onRequestGet(context) {
    const { request, env } = context;

    // 1. Check Cloudflare Access identity headers
    const email = request.headers.get('cf-access-authenticated-user-email');
    const name = request.headers.get('cf-access-authenticated-user-name') || 'Doctor';

    if (email) {
        return new Response(JSON.stringify({
            authenticated: true,
            method: 'cloudflare',
            email: email,
            name: name,
            short_name: email.split('@')[0]
        }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    // 2. Fallback: Check for Manual PIN (passed in custom header)
    const pin = request.headers.get('x-radres-pin');
    const systemPin = env.EMERGENCY_PIN || '1234'; // Default to 1234 if not set

    if (pin === systemPin) {
        return new Response(JSON.stringify({
            authenticated: true,
            method: 'pin',
            email: 'resident@emergency.local',
            name: 'Emergency Doctor',
            short_name: 'Resident'
        }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    return new Response(JSON.stringify({ authenticated: false, email: 'Guest' }), {
        headers: { "Content-Type": "application/json" }
    });
}

