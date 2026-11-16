
const encoder = new TextEncoder();

function fromBase64(value) {
    return Uint8Array.from(
        atob(value),
        char => char.charCodeAt(0)
    );
}

async function verifyPassword(password, storedHash) {
    const [saltText, hashText] = storedHash.split(".");

    if (!saltText || !hashText) return false;

    const salt = fromBase64(saltText);
    const originalHash = fromBase64(hashText);

    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
    );

    const result = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt,
            iterations: 310000,
            hash: "SHA-256"
        },
        key,
        256
    );

    const newHash = new Uint8Array(result);

    if (newHash.length !== originalHash.length) return false;

    let difference = 0;

    for (let i = 0; i < newHash.length; i++) {
        difference |= newHash[i] ^ originalHash[i];
    }

    return difference === 0;
}

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
    try {
        const { username, password } = await request.json();

        if (
            typeof username !== "string" ||
            typeof password !== "string" ||
            username.length > 100 ||
            password.length > 256
        ) {
            return Response.json(
                { success: false, message: "Invalid input" },
                { status: 400 }
            );
        }

        const admin = await env.DB.prepare(
            "SELECT id, password_hash FROM admins WHERE username = ?"
        ).bind(username).first();

        if (!admin || !(await verifyPassword(password, admin.password_hash))) {
            return Response.json(
                { success: false, message: "Invalid username or password" },
                { status: 401 }
            );
        }

        const tokenBytes = crypto.getRandomValues(new Uint8Array(32));

        const token = Array.from(tokenBytes)
            .map(byte => byte.toString(16).padStart(2, "0"))
            .join("");

        const tokenHash = await sha256(token);
        const expiresAt = Math.floor(Date.now() / 1000) + 604800;

        await env.DB.prepare(
            "INSERT INTO admin_sessions (session_token_hash, expires_at) VALUES (?, ?)"
        ).bind(tokenHash, expiresAt).run();

        return Response.json(
            { success: true, message: "Login successful" },
            {
                headers: {
                    "Set-Cookie":
                        `admin_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`
                }
            }
        );

    } catch (error) {
        return Response.json(
            { success: false, message: "Login failed" },
            { status: 500 }
        );
    }
}
