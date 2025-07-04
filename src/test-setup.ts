import { vi } from "vitest";

vi.mock("ink-spinner", () => ({
  default: () => "Spinner",
}));
