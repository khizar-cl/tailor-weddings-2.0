import type { Middleware, ORPCErrorConstructorMap } from "@orpc/server";
import { ORPCError } from "@orpc/server";
import type { UserRole } from "@repo/shared";

export interface RequireRoleContext {
	dbUser: { role: UserRole };
}

/**
 * Returns an oRPC middleware that allows the request through when
 * `context.dbUser.role` is in `allowedRoles`, and throws FORBIDDEN otherwise.
 * Reads `context.dbUser.role` (loaded once by `protectedProcedure`) — no extra
 * query. It adds no context and passes the procedure's output through untouched.
 *
 * Compose with `protectedProcedure.<path>.use(requireRole(Roles.ADMIN))`.
 */
export function requireRole(...allowedRoles: UserRole[]): Middleware<
	RequireRoleContext,
	Record<never, never>,
	unknown,
	// oRPC types reusable-middleware output as `any` by design so one middleware
	// can wrap a procedure of any output type (see its `.middleware` overload).
	// biome-ignore lint/suspicious/noExplicitAny: matches oRPC's reusable-middleware output contract
	any,
	ORPCErrorConstructorMap<Record<never, never>>,
	Record<never, never>
> {
	return ({ context, next }) => {
		if (!allowedRoles.includes(context.dbUser.role)) {
			throw new ORPCError("FORBIDDEN", { message: "Permission denied" });
		}
		return next();
	};
}
