"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Sends already-authenticated visitors from a public marketing page to their
 * portal. Renders nothing so the server-rendered page stays instantly visible
 * to signed-out visitors (good for SEO and first paint).
 */
export function SignedInRedirect() {
	const { isLoaded, isSignedIn } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (isLoaded && isSignedIn) {
			router.replace("/portal");
		}
	}, [isLoaded, isSignedIn, router]);

	return null;
}
