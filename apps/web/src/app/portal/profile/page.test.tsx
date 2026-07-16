import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
	mockLoadingUser,
	mockUnauthenticatedUser,
	mockUser,
} from "../../../../tests/helpers/clerk.test-helper";
import type { AuthContextValue, AuthUser } from "../../../hooks/use-auth";
import ProfilePage from "./page";

const mockAuthUser: AuthUser = {
	uuid: "usr_1",
	name: "Test User",
	email: "test@example.com",
	role: "member",
	imageUrl: null,
	capabilities: { isCouple: true, isVendor: false },
	activeMode: "couple",
	onboarding: { couple: true, vendor: false },
};

const authState: { value: AuthContextValue } = {
	value: {
		user: mockAuthUser,
		isLoading: false,
		isError: false,
		error: null,
		refetch: async () => undefined,
	},
};

vi.mock("../../../hooks/use-auth", () => ({
	useAuth: () => authState.value,
}));

afterEach(() => {
	authState.value = {
		user: mockAuthUser,
		isLoading: false,
		isError: false,
		error: null,
		refetch: async () => undefined,
	};
});

describe("ProfilePage", () => {
	it("shows loading skeleton while the user is loading", () => {
		mockLoadingUser();
		const { container } = render(<ProfilePage />);
		expect(
			container.querySelector('[data-slot="skeleton"]'),
		).toBeInTheDocument();
	});

	it("shows sign-in prompt when no user", () => {
		mockUnauthenticatedUser();
		render(<ProfilePage />);
		expect(
			screen.getByText("Sign in to view your profile."),
		).toBeInTheDocument();
	});

	it("displays user avatar with name as alt text", () => {
		render(<ProfilePage />);
		const avatar = screen.getByAltText("Test User");
		expect(avatar).toHaveAttribute("src", "https://example.com/avatar.png");
	});

	it("shows fallback icon when user has no avatar", () => {
		const original = mockUser.imageUrl;
		mockUser.imageUrl = "";
		render(<ProfilePage />);
		expect(screen.queryByRole("img")).not.toBeInTheDocument();
		mockUser.imageUrl = original;
	});

	it("displays the read-only email and member-since facts", () => {
		render(<ProfilePage />);
		expect(screen.getByText("test@example.com")).toBeInTheDocument();
		expect(screen.getByText("January 15, 2025")).toBeInTheDocument();
	});

	it("prefills the editable name fields from the user", () => {
		render(<ProfilePage />);
		expect(screen.getByLabelText("First name")).toHaveValue("Test");
		expect(screen.getByLabelText(/Last name/)).toHaveValue("User");
		expect(
			screen.getByRole("button", { name: "Save changes" }),
		).toBeInTheDocument();
	});
});
