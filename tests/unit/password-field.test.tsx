import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PasswordField } from "@/components/PasswordField";

describe("PasswordField", () => {
  it("is masked and can be revealed from the keyboard", async () => {
    const user = userEvent.setup();
    render(
      <PasswordField
        autoComplete="current-password"
        label="Password"
        name="password"
        required
      />
    );
    const input = screen.getByLabelText("Password", { exact: true });
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("autocomplete", "current-password");
    await user.tab();
    await user.tab();
    await user.keyboard("{Enter}");
    expect(input).toHaveAttribute("type", "text");
  });
});
