interface Env {
	DB: D1Database;
}

function json(data: unknown, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			"Content-Type": "application/json",
		},
	});
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		// Simple check that the CallIQ API is running
		if (url.pathname === "/api/health" && request.method === "GET") {
			return json({
				success: true,
				message: "CallIQ API is running",
			});
		}

		// Get calls from the CallIQ database
		if (url.pathname === "/api/calls" && request.method === "GET") {
			try {
				const { results } = await env.calliq_db.prepare(
					`SELECT * FROM calls
					 ORDER BY created_at DESC
					 LIMIT 100`
				).all();

				return json({
					success: true,
					calls: results,
				});
			} catch (error) {
				console.error("Unable to load calls:", error);

				return json(
					{
						success: false,
						error: "Unable to load calls",
					},
					500
				);
			}
		}

		return json(
			{
				success: false,
				error: "Not Found",
			},
			404
		);
	},
} satisfies ExportedHandler<Env>