export async function onRequestGet(context) {
    const { env, request } = context;

    // 1. Resolve Identity
    const cfEmail = request.headers.get('cf-access-authenticated-user-email');
    const pin = request.headers.get('x-radres-pin');
    const systemPin = env.EMERGENCY_PIN || '1234';

    let email = cfEmail;
    if (!email && pin === systemPin) {
        email = 'resident@emergency.local';
    }

    if (!email) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        if (!env.USER_DATA) {
            throw new Error('KV Namespace USER_DATA not bound');
        }

        const data = await env.USER_DATA.get(email);
        if (data) {
            return new Response(data, {
                headers: { "Content-Type": "application/json" }
            });
        }
    } catch (err) {
        console.error(err);
    }

    // Default stats if none found
    const defaultStats = {
        streak: 0,
        due_today: 0,
        accuracy: 0,
        user_email: email
    };

    return new Response(JSON.stringify(defaultStats), {
        headers: { "Content-Type": "application/json" }
    });
}

export async function onRequestPost(context) {
    const { env, request } = context;
    // 1. Resolve Identity
    const cfEmail = request.headers.get('cf-access-authenticated-user-email');
    const pin = request.headers.get('x-radres-pin');
    const systemPin = env.EMERGENCY_PIN || '1234';

    let email = cfEmail;
    if (!email && pin === systemPin) {
        email = 'resident@emergency.local';
    }

    if (!email) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const body = await request.json();
        if (env.USER_DATA) {
            await env.USER_DATA.put(email, JSON.stringify(body));
            return new Response(JSON.stringify({ success: true }), {
                headers: { "Content-Type": "application/json" }
            });
        }
        return new Response("KV not configured", { status: 500 });
    } catch (err) {
        return new Response(err.message, { status: 500 });
    }
}
