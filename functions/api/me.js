
const encoder = new TextEncoder();

async function sha256(value) {
    const result = await crypto.subtle.digest(
        "SHA-256",
        encoder.encode(value)
    );

    return Array.from(new Uint8Array(result))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

export async function onRequestGet({ request, env }) {
    const cookie = request.headers.get("Cookie") || "";
    const match = cookie.match(/(?:^|;\s*)admin_session=([^;]+)/);

    if (!match) {
        return Response.json({ authenticated: false });
    }

    const tokenHash = await sha256(match[1]);

    const session = await env.DB.prepare(
        "SELECT id FROM admin_sessions WHERE session_token_hash = ? AND expires_at > ?"
    ).bind(tokenHash, Math.floor(Date.now() / 1000)).first();

    return Response.json({
        authenticated: Boolean(session)
    });
}
