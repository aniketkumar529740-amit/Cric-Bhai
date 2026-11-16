
export async function onRequestGet({ env }) {
    try {
        const result = await env.DB.prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='admins'"
        ).first();

        return Response.json({
            success: true,
            database: "Connected",
            adminsTable: Boolean(result)
        });

    } catch (error) {
        return Response.json({
            success: false,
            error: "Database connection failed"
        }, { status: 500 });
    }
}
