import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  authenticateAdmin: vi.fn(),
  hashPassword: vi.fn(),
  userFindFirst: vi.fn(),
  adminUserFindFirst: vi.fn(),
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({
  authenticateAdmin: mocks.authenticateAdmin,
}));

vi.mock("@/lib/auth", () => ({
  hashPassword: mocks.hashPassword,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findFirst: mocks.userFindFirst,
      findUnique: mocks.userFindUnique,
      create: mocks.userCreate,
    },
    adminUser: {
      findFirst: mocks.adminUserFindFirst,
    },
  },
}));

import { POST } from "@/app/api/admin/users/route";

describe("Task #6567: admin user creation duplicate email guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateAdmin.mockResolvedValue({ id: "admin_6567", role: "SUPER_ADMIN" });
    mocks.hashPassword.mockResolvedValue("hashed-password");
    mocks.userFindFirst.mockResolvedValue(null);
    mocks.adminUserFindFirst.mockResolvedValue(null);
    mocks.userFindUnique.mockResolvedValue(null);
    mocks.userCreate.mockResolvedValue({
      id: "user_new",
      email: "fresh@smsok.com",
      phone: "0812345678",
      name: "Fresh User",
      role: "user",
      createdAt: new Date("2026-03-17T00:00:00.000Z"),
    });
  });

  it("returns 409 when the email already exists on a customer account", async () => {
    mocks.userFindFirst.mockResolvedValue({ id: "user_existing" });

    const response = await POST(
      new NextRequest("http://localhost/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          email: "admin@smsok.com",
          phone: "0812345678",
          name: "Duplicate",
          password: "Admin123!safe",
          role: "user",
        }),
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: "อีเมลนี้ถูกใช้งานแล้ว",
      code: "DUPLICATE",
    });
    expect(mocks.userCreate).not.toHaveBeenCalled();
  });

  it("returns 409 when the email already exists on an admin account", async () => {
    mocks.adminUserFindFirst.mockResolvedValue({ id: "admin_existing" });

    const response = await POST(
      new NextRequest("http://localhost/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          email: "admin@smsok.com",
          phone: "0812345678",
          name: "Duplicate",
          password: "Admin123!safe",
          role: "user",
        }),
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: "อีเมลนี้ถูกใช้งานแล้ว",
      code: "DUPLICATE",
    });
    expect(mocks.userCreate).not.toHaveBeenCalled();
  });

  it("creates a user when email and phone are unique", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          email: "fresh@smsok.com",
          phone: "0812345678",
          name: "Fresh User",
          password: "Admin123!safe",
          role: "user",
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      id: "user_new",
      email: "fresh@smsok.com",
      phone: "0812345678",
    });
    expect(mocks.userCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "fresh@smsok.com",
          phone: "0812345678",
          password: "hashed-password",
        }),
      }),
    );
  });

  it("rejects HTML/script payloads in the name field", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          email: "fresh@smsok.com",
          phone: "0812345678",
          name: "<script>alert(1)</script>",
          password: "Admin123!safe",
          role: "user",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่",
      code: "1001",
    });
    expect(mocks.userCreate).not.toHaveBeenCalled();
  });
});
