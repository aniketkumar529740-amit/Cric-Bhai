
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

export async function onRequestPost({ request, env }) {
    const cookie = request.headers.get("Cookie") || "";
    const match = cookie.match(/(?:^|;\s*)admin_session=([^;]+)/);

    if (match) {
        const tokenHash = await sha256(match[1]);

        await env.DB.prepare(
            "DELETE FROM admin_sessions WHERE session_token_hash = ?"
        ).bind(tokenHash).run();
    }

    return Response.json(
        { success: true, message: "Logged out" },
        {
            headers: {
                "Set-Cookie":
                    "admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"
            }
        }
    );
}
