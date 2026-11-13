interface Env {
	calliq_db: D1Database;
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
				const { results } = await env.calliq_db.prepare(`
SELECT
  calls.*,
  contacts.name AS customer_name,
  contacts.phone AS customer_phone,
  users.name AS consultant_name
FROM calls
LEFT JOIN contacts
  ON calls.contact_id = contacts.id
LEFT JOIN users
  ON calls.consultant_id = users.id
ORDER BY calls.created_at DESC
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

    // Save a new call to the CallIQ database
    if (url.pathname === "/api/calls" && request.method === "POST") {
      try {
        const body = await request.json() as {
			customerName?: string;
			phone?: string;
			email?: string;
			consultant?: string;
          direction?: string;
          call_reason?: string;
          outcome?: string;
          duration_seconds?: number;
          notes?: string;
          appointment_booked?: boolean;
        };



const customerName = body.customerName?.trim();
const customerPhone = body.phone?.trim();
const customerEmail = body.email?.trim();

let contactId: number | null = null;

if (customerName && customerPhone) {
  const contact = await env.calliq_db.prepare(
    `INSERT INTO contacts
      (organization_id, name, phone, email)
     VALUES (?, ?, ?, ?)`
  )
  .bind(1, customerName, customerPhone, customerEmail || null)
  .run();

  contactId = contact.meta.last_row_id;
}let consultantId: number | null = null;

if (body.consultant) {
  const consultant = await env.calliq_db
    .prepare(
      "SELECT id FROM users WHERE name = ? LIMIT 1"
    )
    .bind(body.consultant.trim() ?? "")
    .first<{ id: number }>();

  consultantId = consultant?.id ?? null;
}

        const result = await env.calliq_db.prepare(
          `INSERT INTO calls (
            organization_id,
			contact_id,
			consultant_id,
            direction,
            call_reason,
            outcome,
            duration_seconds,
            notes,
            appointment_booked
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          1,
		  contactId,
		  consultantId,
          body.direction ?? "Inbound",
          body.call_reason ?? null,
          body.outcome ?? "Resolved",
          body.duration_seconds ?? 0,
          body.notes ?? null,
          body.appointment_booked ? 1 : 0
        )
        .run();

        return json({
          success: true,
          message: "Call saved successfully",
          id: result.meta.last_row_id,
        }, 201);

      } catch (error) {
        console.error("Unable to save call:", error);

        return json({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        }, 500);
      }
    }		return json(
			{
				success: false,
				error: "Not Found",
			},
			404
		);
	},
} satisfies ExportedHandler<Env>
