import { describe, expect, test } from "bun:test";
import { hasPermission, RolePermissions } from "../src/lib/permissions";

describe("author role", () => {
  test("can write Testimonies and Rooted Thoughts posts", () => {
    expect(hasPermission("author", "write_posts")).toBe(true);
  });
  test("cannot delete posts or moderate comments", () => {
    expect(hasPermission("author", "manage_testimonies")).toBe(false);
  });
  test("has no admin panel or other content access", () => {
    expect(RolePermissions.author).toEqual(["view_public_content", "write_posts"]);
  });
  test("editors and administrators keep post writing access", () => {
    expect(hasPermission("editor", "write_posts")).toBe(true);
    expect(hasPermission("administrator", "write_posts")).toBe(true);
  });
});
