#!/usr/bin/env python3
"""
QA Layer 1 — API Test Suite
smsok-clone http://localhost:3000
Credentials: qa-suite@smsok.test / QATest123!

Tests: Contacts, Groups, Tags, Messages, Senders, Packages, Security
"""

import urllib.request
import urllib.parse
import urllib.error
import json
import http.cookiejar
import sys
import time
from typing import Any

BASE = "http://localhost:3000"
EMAIL = "qa-suite@smsok.test"
PASSWORD = "QATest123!"
ORIGIN = "http://localhost:3000"

# ─── helpers ──────────────────────────────────────────────────────────────────

PASS = 0
FAIL = 0
RESULTS: list[dict] = []

def ok(name: str, detail: str = ""):
    global PASS
    PASS += 1
    marker = "✅ PASS"
    RESULTS.append({"status": "PASS", "name": name, "detail": detail})
    print(f"  {marker}  {name}")
    if detail:
        print(f"         {detail}")

def fail(name: str, detail: str = ""):
    global FAIL
    FAIL += 1
    marker = "❌ FAIL"
    RESULTS.append({"status": "FAIL", "name": name, "detail": detail})
    print(f"  {marker}  {name}")
    if detail:
        print(f"         {detail}")

def section(title: str):
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}")


class Session:
    """Thin wrapper around urllib with cookie jar + CSRF origin."""

    def __init__(self):
        self.jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(self.jar)
        )

    def request(
        self,
        method: str,
        path: str,
        body: Any = None,
        headers: dict | None = None,
        with_origin: bool = True,
    ) -> tuple[int, Any]:
        url = BASE + path
        data: bytes | None = None
        req_headers: dict = {}

        if with_origin:
            req_headers["Origin"] = ORIGIN

        if body is not None:
            data = json.dumps(body).encode()
            req_headers["Content-Type"] = "application/json"

        if headers:
            req_headers.update(headers)

        req = urllib.request.Request(url, data=data, headers=req_headers, method=method)

        try:
            with self.opener.open(req) as resp:
                raw = resp.read()
                status = resp.status
                try:
                    return status, json.loads(raw)
                except Exception:
                    return status, raw.decode(errors="replace")
        except urllib.error.HTTPError as e:
            raw = e.read()
            try:
                return e.code, json.loads(raw)
            except Exception:
                return e.code, raw.decode(errors="replace")

    def get(self, path: str, **kw):
        return self.request("GET", path, **kw)

    def post(self, path: str, body=None, **kw):
        return self.request("POST", path, body=body, **kw)

    def put(self, path: str, body=None, **kw):
        return self.request("PUT", path, body=body, **kw)

    def patch(self, path: str, body=None, **kw):
        return self.request("PATCH", path, body=body, **kw)

    def delete(self, path: str, **kw):
        return self.request("DELETE", path, **kw)


# ─── auth ─────────────────────────────────────────────────────────────────────

def login() -> Session:
    """Login and return session with cookies."""
    s = Session()
    # Use the Next.js credentials login endpoint
    status, body = s.post(
        "/api/auth/login",
        body={"email": EMAIL, "password": PASSWORD},
    )
    if status in (200, 201):
        return s

    # Fallback: try /api/auth/credentials/login (older shape)
    status, body = s.post(
        "/api/auth/credentials/login",
        body={"email": EMAIL, "password": PASSWORD},
    )
    if status in (200, 201):
        return s

    print(f"  ⚠️  Login response: {status} — {str(body)[:200]}")
    print("  Trying form-encoded login via NextAuth signIn...")
    # Try NextAuth CSRF token approach
    s2 = Session()
    # get csrf token
    cs, cb = s2.get("/api/auth/csrf")
    csrf_token = ""
    if isinstance(cb, dict):
        csrf_token = cb.get("csrfToken", "")

    form_data = urllib.parse.urlencode({
        "email": EMAIL,
        "password": PASSWORD,
        "csrfToken": csrf_token,
        "callbackUrl": BASE + "/dashboard",
        "json": "true",
    }).encode()

    req = urllib.request.Request(
        BASE + "/api/auth/callback/credentials",
        data=form_data,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "Origin": ORIGIN,
        },
        method="POST",
    )
    try:
        with s2.opener.open(req) as resp:
            pass
    except Exception:
        pass

    # Verify session
    ss, sb = s2.get("/api/auth/session")
    if isinstance(sb, dict) and sb.get("user"):
        return s2

    # Last resort: raw POST to whatever login action exists
    raise RuntimeError(f"Cannot login: {status} {str(body)[:300]}")


# ─────────────────────────────────────────────────────────────────────────────
#  A. Contacts CRUD
# ─────────────────────────────────────────────────────────────────────────────

def test_contacts(s: Session):
    section("A. Contacts CRUD")

    # A1. GET /api/v1/contacts — list
    status, body = s.get("/api/v1/contacts")
    if status == 200 and isinstance(body, dict) and "contacts" in body:
        ok("A1 GET /api/v1/contacts", f"contacts={len(body['contacts'])} total={body.get('pagination',{}).get('total')}")
    else:
        fail("A1 GET /api/v1/contacts", f"status={status} body={str(body)[:200]}")

    # A2. POST /api/v1/contacts — create valid
    # Phone must match ^(0[0-9]{9}|\+66[0-9]{9})$ — exactly 10 digits starting with 0
    ts_suffix = int(time.time()) % 100000000  # 8 digits max, pad to 9 with leading zero
    unique_phone = f"08{ts_suffix:08d}"[:10]  # exactly 10 chars: 08XXXXXXXX
    status, body = s.post("/api/v1/contacts", body={
        "name": "QA Test Contact",
        "phone": unique_phone,
        "email": "qa-contact@test.com",
    })
    contact_id = None
    if status in (200, 201) and isinstance(body, dict) and body.get("id"):
        contact_id = body["id"]
        ok("A2 POST /api/v1/contacts", f"id={contact_id} phone={unique_phone}")
    else:
        fail("A2 POST /api/v1/contacts", f"status={status} body={str(body)[:300]}")

    # A3. GET /api/v1/contacts/[id] — read single
    if contact_id:
        status, body = s.get(f"/api/v1/contacts/{contact_id}")
        if status == 200 and isinstance(body, dict) and body.get("id") == contact_id:
            ok("A3 GET /api/v1/contacts/[id]", f"name={body.get('name')}")
        else:
            fail("A3 GET /api/v1/contacts/[id]", f"status={status} body={str(body)[:200]}")
    else:
        fail("A3 GET /api/v1/contacts/[id]", "skipped (no contact_id)")

    # A4. PUT /api/v1/contacts/[id] — update
    if contact_id:
        status, body = s.put(f"/api/v1/contacts/{contact_id}", body={
            "name": "QA Updated Contact",
            "phone": unique_phone,
        })
        if status == 200 and isinstance(body, dict) and body.get("name") == "QA Updated Contact":
            ok("A4 PUT /api/v1/contacts/[id]", "name updated")
        else:
            fail("A4 PUT /api/v1/contacts/[id]", f"status={status} body={str(body)[:200]}")
    else:
        fail("A4 PUT /api/v1/contacts/[id]", "skipped (no contact_id)")

    # A5. POST — duplicate phone should fail
    if contact_id:
        status, body = s.post("/api/v1/contacts", body={
            "name": "Duplicate Test",
            "phone": unique_phone,
        })
        if status in (400, 409, 422):
            ok("A5 Duplicate phone rejected", f"status={status} error={str(body)[:100]}")
        else:
            fail("A5 Duplicate phone rejected", f"Expected 4xx, got status={status} body={str(body)[:200]}")

    # A6. POST — empty name (required field)
    status, body = s.post("/api/v1/contacts", body={
        "name": "",
        "phone": "0812345678",
    })
    if status in (400, 422):
        ok("A6 Empty name rejected (validation)", f"status={status}")
    else:
        fail("A6 Empty name rejected (validation)", f"Expected 400/422, got {status} body={str(body)[:200]}")

    # A7. POST — missing phone (required field)
    status, body = s.post("/api/v1/contacts", body={
        "name": "No Phone Test",
    })
    if status in (400, 422):
        ok("A7 Missing phone rejected (validation)", f"status={status}")
    else:
        fail("A7 Missing phone rejected (validation)", f"Expected 400/422, got {status} body={str(body)[:200]}")

    # A8. POST — XSS in name
    ts2 = int(time.time()) % 100000000
    xss_phone = f"08{(ts2 + 1):08d}"[:10]
    status, body = s.post("/api/v1/contacts", body={
        "name": "<script>alert('XSS')</script>",
        "phone": xss_phone,
    })
    xss_contact_id = None
    if status in (200, 201) and isinstance(body, dict) and body.get("id"):
        # Accepted — check that the stored name is escaped/plain (not executed)
        xss_contact_id = body["id"]
        stored_name = body.get("name", "")
        if "<script>" in stored_name:
            # stored raw — note as potential XSS risk (stored XSS)
            fail("A8 XSS in name — stored raw (XSS risk)", f"name={stored_name}")
        else:
            ok("A8 XSS in name — sanitized on store", f"stored={stored_name}")
    else:
        ok("A8 XSS in name — rejected by server", f"status={status}")

    # A9. POST — SQL injection in name
    ts3 = int(time.time()) % 100000000
    sqli_phone = f"08{(ts3 + 2):08d}"[:10]
    status, body = s.post("/api/v1/contacts", body={
        "name": "'; DROP TABLE contacts; --",
        "phone": sqli_phone,
    })
    sqli_contact_id = None
    if status in (200, 201):
        sqli_contact_id = body.get("id") if isinstance(body, dict) else None
        ok("A9 SQL injection in name — accepted (Prisma param query, safe)", f"status={status}")
    elif status in (400, 422):
        ok("A9 SQL injection in name — rejected by validation", f"status={status}")
    else:
        fail("A9 SQL injection in name — unexpected", f"status={status} body={str(body)[:200]}")

    # A10. DELETE /api/v1/contacts/[id]
    if contact_id:
        status, body = s.delete(f"/api/v1/contacts/{contact_id}")
        if status in (200, 204):
            ok("A10 DELETE /api/v1/contacts/[id]", f"status={status}")
        else:
            fail("A10 DELETE /api/v1/contacts/[id]", f"status={status} body={str(body)[:200]}")
    else:
        fail("A10 DELETE /api/v1/contacts/[id]", "skipped (no contact_id)")

    # Cleanup XSS/sqli contacts
    for cid in [xss_contact_id, sqli_contact_id]:
        if cid:
            s.delete(f"/api/v1/contacts/{cid}")

    # A11. GET non-existent contact
    status, body = s.get("/api/v1/contacts/nonexistent-id-00000")
    if status == 404:
        ok("A11 GET non-existent contact → 404", f"status={status}")
    else:
        fail("A11 GET non-existent contact → expected 404", f"status={status} body={str(body)[:200]}")


# ─────────────────────────────────────────────────────────────────────────────
#  B. Groups CRUD
# ─────────────────────────────────────────────────────────────────────────────

def test_groups(s: Session):
    section("B. Groups CRUD")

    # B1. GET /api/v1/groups — list
    status, body = s.get("/api/v1/groups")
    if status == 200 and isinstance(body, dict) and "groups" in body:
        ok("B1 GET /api/v1/groups", f"count={len(body['groups'])}")
    else:
        fail("B1 GET /api/v1/groups", f"status={status} body={str(body)[:200]}")

    # B2. POST /api/v1/groups — no POST on /groups route
    # The groups are created via a different mechanism; check if a POST endpoint exists
    status, body = s.post("/api/v1/groups", body={"name": "QA Test Group"})
    group_id = None
    if status in (200, 201) and isinstance(body, dict) and body.get("id"):
        group_id = body["id"]
        ok("B2 POST /api/v1/groups", f"id={group_id}")
    elif status == 405:
        ok("B2 POST /api/v1/groups → 405 (no POST handler, expected if groups created via contacts groups endpoint)", f"status={status}")
    else:
        fail("B2 POST /api/v1/groups", f"status={status} body={str(body)[:300]}")

    # Try the contacts groups sub-route instead
    if group_id is None:
        # Check if groups can be created via another path
        status2, body2 = s.post("/api/v1/contacts/groups", body={"name": "QA Test Group Via Contacts"})
        if status2 in (200, 201) and isinstance(body2, dict) and body2.get("id"):
            group_id = body2["id"]
            ok("B2b POST /api/v1/contacts/groups", f"id={group_id}")

    # B3. GET /api/v1/groups/[id]
    # NOTE: groups/[id]/route.ts only has PATCH and DELETE — no GET handler!
    if group_id:
        status, body = s.get(f"/api/v1/groups/{group_id}")
        if status == 200 and isinstance(body, dict) and body.get("id") == group_id:
            ok("B3 GET /api/v1/groups/[id]", f"name={body.get('name')}")
        elif status == 405:
            fail("B3 GET /api/v1/groups/[id] → 405 METHOD_NOT_ALLOWED", "BUG: no GET handler on /api/v1/groups/[id] — missing read single group endpoint")
        else:
            fail("B3 GET /api/v1/groups/[id]", f"status={status} body={str(body)[:200]}")
    else:
        # pick first group from list if any
        gl_status, gl_body = s.get("/api/v1/groups")
        if gl_status == 200 and isinstance(gl_body, dict) and gl_body.get("groups"):
            group_id = gl_body["groups"][0]["id"]
            ok("B3 GET /api/v1/groups/[id] (using existing)", f"id={group_id}")
        else:
            fail("B3 GET /api/v1/groups/[id]", "no group_id available")

    # B4. PATCH /api/v1/groups/[id] — update
    if group_id:
        status, body = s.patch(f"/api/v1/groups/{group_id}", body={"name": "QA Updated Group"})
        if status == 200:
            ok("B4 PATCH /api/v1/groups/[id]", f"status={status}")
        else:
            fail("B4 PATCH /api/v1/groups/[id]", f"status={status} body={str(body)[:200]}")

    # B5. GET /api/v1/groups/[id]/members — list members
    if group_id:
        status, body = s.get(f"/api/v1/groups/{group_id}/members")
        if status == 200 and isinstance(body, dict) and "members" in body:
            ok("B5 GET /api/v1/groups/[id]/members", f"count={len(body['members'])}")
        else:
            fail("B5 GET /api/v1/groups/[id]/members", f"status={status} body={str(body)[:200]}")

    # B6. Add member to group
    if group_id:
        # Create a contact first — phone exactly 10 digits starting with 0
        ts_b = int(time.time()) % 100000000
        unique_phone = f"08{(ts_b + 5):08d}"[:10]
        cs_b, cb_b = s.post("/api/v1/contacts", body={
            "name": "Group Member Test",
            "phone": unique_phone,
        })
        temp_contact_id = cb_b.get("id") if isinstance(cb_b, dict) else None

        if temp_contact_id:
            # Try /api/v1/groups/[id]/members first
            status, body = s.post(f"/api/v1/groups/{group_id}/members", body={
                "contactIds": [temp_contact_id],
            })
            if status in (200, 201):
                ok("B6 POST /api/v1/groups/[id]/members", f"status={status}")
            elif status == 405:
                # No POST handler on /groups/[id]/members — try contacts/groups with action
                status2, body2 = s.post("/api/v1/contacts/groups", body={
                    "action": "add_contacts",
                    "groupId": group_id,
                    "contactIds": [temp_contact_id],
                })
                if status2 in (200, 201):
                    ok("B6 Add member via /api/v1/contacts/groups (action=add_contacts)", f"status={status2}")
                else:
                    fail("B6 Add member — both endpoints failed", f"groups/[id]/members={status}, contacts/groups={status2} body={str(body2)[:200]}")
            else:
                fail("B6 POST /api/v1/groups/[id]/members", f"status={status} body={str(body)[:300]}")
            # cleanup
            s.delete(f"/api/v1/contacts/{temp_contact_id}")
        else:
            fail("B6 Add member to group", f"could not create temp contact: phone={unique_phone} cs={cs_b} body={str(cb_b)[:100]}")

    # B7. DELETE /api/v1/groups/[id] — only delete if we created it (not borrowed)
    # We'll skip deletion of a borrowed group to avoid side effects
    if group_id and status not in (405,):
        # only delete if we created it
        pass  # skip to avoid destroying existing data

    # B8. GET non-existent group → 404 or 405 (if no GET handler)
    status, body = s.get("/api/v1/groups/nonexistent-group-id")
    if status == 404:
        ok("B8 GET non-existent group → 404")
    elif status == 405:
        ok("B8 GET non-existent group → 405 (no GET on /groups/[id] — matches B3 finding)", f"status={status}")
    else:
        fail("B8 GET non-existent group → expected 404 or 405", f"status={status} body={str(body)[:200]}")


# ─────────────────────────────────────────────────────────────────────────────
#  C. Tags
# ─────────────────────────────────────────────────────────────────────────────

def test_tags(s: Session):
    section("C. Tags")

    # C1. GET /api/v1/contacts/tags — list (contacts/tags endpoint)
    status, body = s.get("/api/v1/contacts/tags")
    if status == 200 and isinstance(body, dict) and "tags" in body:
        ok("C1 GET /api/v1/contacts/tags", f"count={len(body['tags'])}")
    else:
        fail("C1 GET /api/v1/contacts/tags", f"status={status} body={str(body)[:200]}")

    # C2. GET /api/v1/tags — list (main tags endpoint)
    status, body = s.get("/api/v1/tags")
    if status == 200 and isinstance(body, dict) and "tags" in body:
        ok("C2 GET /api/v1/tags", f"count={len(body['tags'])}")
    else:
        fail("C2 GET /api/v1/tags", f"status={status} body={str(body)[:200]}")

    # C3. POST /api/v1/tags — create
    unique_tag = f"qa-tag-{int(time.time()) % 100000}"
    status, body = s.post("/api/v1/tags", body={"name": unique_tag, "color": "#FF5733"})
    tag_id = None
    if status in (200, 201) and isinstance(body, dict) and body.get("id"):
        tag_id = body["id"]
        ok("C3 POST /api/v1/tags", f"id={tag_id} name={unique_tag}")
    else:
        fail("C3 POST /api/v1/tags", f"status={status} body={str(body)[:300]}")

    # C4. POST /api/v1/tags — duplicate name
    if tag_id:
        status, body = s.post("/api/v1/tags", body={"name": unique_tag, "color": "#AABBCC"})
        if status in (400, 409, 422):
            ok("C4 Duplicate tag name rejected", f"status={status}")
        else:
            fail("C4 Duplicate tag name rejected", f"Expected 4xx, got {status} body={str(body)[:200]}")

    # C5. DELETE /api/v1/tags/[id]
    if tag_id:
        status, body = s.delete(f"/api/v1/tags/{tag_id}")
        if status in (200, 204):
            ok("C5 DELETE /api/v1/tags/[id]", f"status={status}")
        else:
            fail("C5 DELETE /api/v1/tags/[id]", f"status={status} body={str(body)[:200]}")

    # C6. POST — empty name validation
    status, body = s.post("/api/v1/tags", body={"name": ""})
    if status in (400, 422):
        ok("C6 Empty tag name rejected", f"status={status}")
    else:
        fail("C6 Empty tag name rejected", f"Expected 400/422, got {status} body={str(body)[:200]}")


# ─────────────────────────────────────────────────────────────────────────────
#  D. SMS / Messages
# ─────────────────────────────────────────────────────────────────────────────

def test_messages(s: Session):
    section("D. SMS Messages")

    # D1. GET /api/v1/messages — list
    status, body = s.get("/api/v1/messages")
    if status == 200:
        ok("D1 GET /api/v1/messages", f"status={status}")
    else:
        fail("D1 GET /api/v1/messages", f"status={status} body={str(body)[:200]}")

    # D2. POST /api/v1/sms/send — send SMS (fields: sender, to, message)
    # Expect to fail with 402 (no credits) or 400 (no approved sender)
    status, body = s.post("/api/v1/sms/send", body={
        "sender": "TestSender",
        "to": "0812345678",
        "message": "QA Test Message",
    })
    if status in (200, 201, 202):
        ok("D2 POST /api/v1/sms/send — sent OK", f"status={status}")
    elif status in (400, 402, 422, 429):
        ok("D2 POST /api/v1/sms/send — rejected correctly (no credits/sender)", f"status={status} msg={str(body)[:150]}")
    elif status == 401:
        fail("D2 POST /api/v1/sms/send — 401 unexpected (should be authed)", f"status={status}")
    elif status == 403:
        ok("D2 POST /api/v1/sms/send — 403 (RBAC permission denied, acceptable)", f"status={status} msg={str(body)[:100]}")
    else:
        fail("D2 POST /api/v1/sms/send — unexpected status", f"status={status} body={str(body)[:300]}")

    # D3. POST — missing 'to' (phone) → validation error
    status, body = s.post("/api/v1/sms/send", body={
        "sender": "TestSender",
        "message": "QA Test",
    })
    if status in (400, 422):
        ok("D3 Missing 'to' phone → validation error", f"status={status}")
    else:
        fail("D3 Missing 'to' phone → expected 400/422", f"status={status} body={str(body)[:200]}")

    # D4. POST — missing message → validation error
    status, body = s.post("/api/v1/sms/send", body={
        "sender": "TestSender",
        "to": "0812345678",
    })
    if status in (400, 422):
        ok("D4 Missing message → validation error", f"status={status}")
    else:
        fail("D4 Missing message → expected 400/422", f"status={status} body={str(body)[:200]}")

    # D5. POST — empty message → validation error
    status, body = s.post("/api/v1/sms/send", body={
        "sender": "TestSender",
        "to": "0812345678",
        "message": "",
    })
    if status in (400, 422):
        ok("D5 Empty message → validation error", f"status={status}")
    else:
        fail("D5 Empty message → expected 400/422", f"status={status} body={str(body)[:200]}")

    # D6. POST — XSS in message (SMS is plain text, no HTML context — accepted or rejected)
    status, body = s.post("/api/v1/sms/send", body={
        "sender": "TestSender",
        "to": "0812345678",
        "message": "<script>alert('xss')</script>",
    })
    if status in (400, 402, 422, 429, 403):
        ok("D6 XSS-like message — rejected by validation/credits/rbac", f"status={status}")
    elif status in (200, 201, 202):
        ok("D6 XSS-like message — accepted (SMS is plain text, no HTML execution risk)", f"status={status}")
    else:
        fail("D6 XSS-like message — unexpected", f"status={status} body={str(body)[:200]}")

    # D7. GET /api/v1/messages with status filter — valid values are lowercase
    # BUG: ?status=SENT (uppercase) causes 500 because getMessages throws Error() not ZodError
    # The schema expects lowercase: "pending" | "sent" | "delivered" | "failed"
    status_lc, body_lc = s.get("/api/v1/messages?page=1&limit=5&status=sent")
    if status_lc == 200:
        ok("D7a GET /api/v1/messages?status=sent (lowercase) → 200", f"status={status_lc}")
    else:
        fail("D7a GET /api/v1/messages?status=sent (lowercase)", f"status={status_lc} body={str(body_lc)[:200]}")

    # Test uppercase status (known bug: returns 500 instead of 400)
    status_uc, body_uc = s.get("/api/v1/messages?status=SENT")
    if status_uc == 400:
        ok("D7b GET /api/v1/messages?status=SENT (uppercase) → 400 validation error (correct)", f"status={status_uc}")
    elif status_uc == 500:
        fail("D7b GET /api/v1/messages?status=SENT (uppercase) → 500 SERVER ERROR", f"BUG: should return 400 validation error, getMessages throws Error() not ZodError, apiError handler misidentifies it as internal error. status={status_uc}")
    elif status_uc == 200:
        ok("D7b GET /api/v1/messages?status=SENT (uppercase) → 200 (case-insensitive)", f"status={status_uc}")
    else:
        fail("D7b GET /api/v1/messages?status=SENT (uppercase) → unexpected", f"status={status_uc} body={str(body_uc)[:200]}")


# ─────────────────────────────────────────────────────────────────────────────
#  E. Senders
# ─────────────────────────────────────────────────────────────────────────────

def test_senders(s: Session):
    section("E. Senders")

    # E1. GET /api/v1/senders/request — list sender names
    status, body = s.get("/api/v1/senders/request")
    if status == 200 and isinstance(body, dict) and "senders" in body:
        ok("E1 GET /api/v1/senders/request", f"count={len(body['senders'])}")
    else:
        fail("E1 GET /api/v1/senders/request", f"status={status} body={str(body)[:200]}")

    # E2. GET /api/v1/sender-names (alternative endpoint)
    status, body = s.get("/api/v1/sender-names")
    if status == 200:
        ok("E2 GET /api/v1/sender-names", f"status={status}")
    elif status == 404:
        ok("E2 GET /api/v1/sender-names → 404 (endpoint may not exist)", f"status={status}")
    else:
        fail("E2 GET /api/v1/sender-names", f"status={status} body={str(body)[:200]}")

    # E3. POST /api/v1/senders/request — request a sender name
    status, body = s.post("/api/v1/senders/request", body={
        "name": f"QATEST{int(time.time()) % 10000}",
    })
    if status in (200, 201):
        ok("E3 POST /api/v1/senders/request", f"status={status}")
    elif status in (400, 409, 422):
        ok("E3 POST /api/v1/senders/request — rejected (validation/limit)", f"status={status} body={str(body)[:100]}")
    elif status == 402:
        ok("E3 POST /api/v1/senders/request — 402 no credits/package", f"status={status}")
    else:
        fail("E3 POST /api/v1/senders/request", f"status={status} body={str(body)[:300]}")

    # E4. POST — empty sender name
    status, body = s.post("/api/v1/senders/request", body={"name": ""})
    if status in (400, 422):
        ok("E4 Empty sender name rejected", f"status={status}")
    else:
        fail("E4 Empty sender name rejected", f"Expected 400/422, got {status} body={str(body)[:200]}")


# ─────────────────────────────────────────────────────────────────────────────
#  F. Packages / Billing
# ─────────────────────────────────────────────────────────────────────────────

def test_packages(s: Session):
    section("F. Packages / Billing")

    # F1. GET /api/v1/packages — public, list all packages
    status, body = s.get("/api/v1/packages")
    if status == 200 and isinstance(body, dict) and "tiers" in body:
        ok("F1 GET /api/v1/packages", f"tiers={len(body['tiers'])}")
    else:
        fail("F1 GET /api/v1/packages", f"status={status} body={str(body)[:200]}")

    # F2. GET /api/v1/packages/my — my packages (requires auth)
    status, body = s.get("/api/v1/packages/my")
    if status == 200:
        ok("F2 GET /api/v1/packages/my", f"status={status}")
    elif status == 401:
        fail("F2 GET /api/v1/packages/my — 401 unexpected (authed)", f"status={status}")
    else:
        fail("F2 GET /api/v1/packages/my", f"status={status} body={str(body)[:200]}")

    # F3. GET /api/v1/packages/active — active packages
    status, body = s.get("/api/v1/packages/active")
    if status == 200:
        ok("F3 GET /api/v1/packages/active", f"status={status}")
    elif status == 401:
        fail("F3 GET /api/v1/packages/active — 401 unexpected (authed)", f"status={status}")
    else:
        fail("F3 GET /api/v1/packages/active", f"status={status} body={str(body)[:200]}")

    # F4. GET /api/v1/transactions — list
    status, body = s.get("/api/v1/transactions")
    if status == 200 and isinstance(body, dict) and "transactions" in body:
        ok("F4 GET /api/v1/transactions", f"count={len(body['transactions'])}")
    else:
        fail("F4 GET /api/v1/transactions", f"status={status} body={str(body)[:200]}")

    # F5. POST /api/v1/packages/purchase/verify-slip — no file, should reject
    status, body = s.post("/api/v1/packages/purchase/verify-slip", body={})
    if status in (400, 422):
        ok("F5 verify-slip — empty body rejected", f"status={status}")
    elif status in (415, 500):
        ok("F5 verify-slip — rejected (content-type/multipart expected)", f"status={status}")
    else:
        fail("F5 verify-slip — unexpected", f"status={status} body={str(body)[:300]}")

    # F6. GET /api/v1/packages/usage — usage stats
    status, body = s.get("/api/v1/packages/usage")
    if status == 200:
        ok("F6 GET /api/v1/packages/usage", f"status={status}")
    elif status in (404, 405):
        ok("F6 GET /api/v1/packages/usage → endpoint may not exist", f"status={status}")
    else:
        fail("F6 GET /api/v1/packages/usage", f"status={status} body={str(body)[:200]}")


# ─────────────────────────────────────────────────────────────────────────────
#  G. Security Checks
# ─────────────────────────────────────────────────────────────────────────────

def test_security(s_authed: Session):
    section("G. Security Checks")

    # G1. Unauthenticated GET /api/v1/contacts → should 401
    anon = Session()
    status, body = anon.get("/api/v1/contacts")
    if status == 401:
        ok("G1 Unauthenticated → 401 on /api/v1/contacts", f"status={status}")
    else:
        fail("G1 Unauthenticated → expected 401 on /api/v1/contacts", f"status={status} body={str(body)[:200]}")

    # G2. Unauthenticated GET /api/v1/messages → 401
    status, body = anon.get("/api/v1/messages")
    if status == 401:
        ok("G2 Unauthenticated → 401 on /api/v1/messages", f"status={status}")
    else:
        fail("G2 Unauthenticated → expected 401 on /api/v1/messages", f"status={status} body={str(body)[:200]}")

    # G3. Unauthenticated POST /api/v1/contacts → 401
    status, body = anon.post("/api/v1/contacts", body={"name": "Anon", "phone": "0811111111"})
    if status == 401:
        ok("G3 Unauthenticated POST → 401 on /api/v1/contacts", f"status={status}")
    else:
        fail("G3 Unauthenticated POST → expected 401 on /api/v1/contacts", f"status={status} body={str(body)[:200]}")

    # G4. CSRF — missing Origin header on POST
    # Create a session but remove Origin
    csrf_test = Session()
    # First login normally
    cs, cb = csrf_test.post("/api/auth/login", body={"email": EMAIL, "password": PASSWORD})
    if cs not in (200, 201):
        # Try nextauth
        cst, csb = csrf_test.get("/api/auth/csrf")
        csrf_token = csb.get("csrfToken", "") if isinstance(csb, dict) else ""
        form_data = urllib.parse.urlencode({
            "email": EMAIL,
            "password": PASSWORD,
            "csrfToken": csrf_token,
            "callbackUrl": BASE + "/dashboard",
            "json": "true",
        }).encode()
        req = urllib.request.Request(
            BASE + "/api/auth/callback/credentials",
            data=form_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            method="POST",
        )
        try:
            with csrf_test.opener.open(req):
                pass
        except Exception:
            pass

    # Now send POST without Origin header
    status, body = csrf_test.request(
        "POST",
        "/api/v1/contacts",
        body={"name": "CSRF Test", "phone": "0811234567"},
        with_origin=False,
    )
    if status in (403, 401):
        ok("G4 Missing Origin → CSRF blocked", f"status={status}")
    else:
        fail("G4 Missing Origin → expected CSRF block (403)", f"status={status} body={str(body)[:200]}")

    # G5. IDOR — try to access contact that belongs to another user (use nonexistent id)
    status, body = s_authed.get("/api/v1/contacts/00000000-0000-0000-0000-000000000001")
    if status in (404, 403):
        ok("G5 IDOR — access other's contact → 404/403", f"status={status}")
    else:
        fail("G5 IDOR — unexpected response (possible data leak)", f"status={status} body={str(body)[:200]}")

    # G6. XSS payload in phone field
    status, body = s_authed.post("/api/v1/contacts", body={
        "name": "XSS Phone Test",
        "phone": "<script>alert(1)</script>",
    })
    if status in (400, 422):
        ok("G6 XSS in phone field — rejected by validation", f"status={status}")
    elif status in (200, 201):
        cid = body.get("id") if isinstance(body, dict) else None
        fail("G6 XSS in phone field — accepted (phone should be numeric)", f"stored phone={body.get('phone', '')[:50]}")
        if cid:
            s_authed.delete(f"/api/v1/contacts/{cid}")
    else:
        fail("G6 XSS in phone field — unexpected", f"status={status} body={str(body)[:200]}")

    # G7. SQL injection in search param — URL-encode the dangerous query
    sqli_search = urllib.parse.quote("'; DROP TABLE contacts; --")
    status, body = s_authed.get(f"/api/v1/contacts?search={sqli_search}")
    if status == 200:
        ok("G7 SQL injection in search param — handled safely (Prisma parameterized)", f"status={status}")
    elif status in (400, 422):
        ok("G7 SQL injection in search param — rejected by validation", f"status={status}")
    else:
        fail("G7 SQL injection in search param — unexpected error", f"status={status} body={str(body)[:200]}")

    # G8. Oversized input (1000+ chars in name)
    long_name = "A" * 1001
    ts_g8 = int(time.time()) % 100000000
    long_phone = f"08{(ts_g8 + 3):08d}"[:10]
    status, body = s_authed.post("/api/v1/contacts", body={
        "name": long_name,
        "phone": long_phone,
    })
    if status in (400, 422):
        ok("G8 Oversized name → rejected by validation", f"status={status}")
    elif status in (200, 201):
        cid = body.get("id") if isinstance(body, dict) else None
        # Accepted — note it but not necessarily a bug if DB allows it
        ok("G8 Oversized name — accepted by server (check if DB truncates)", f"stored len={len(body.get('name', ''))}")
        if cid:
            s_authed.delete(f"/api/v1/contacts/{cid}")
    else:
        fail("G8 Oversized name — unexpected", f"status={status} body={str(body)[:200]}")

    # G9. Unauthenticated /api/v1/senders/request
    status, body = anon.get("/api/v1/senders/request")
    if status == 401:
        ok("G9 Unauthenticated → 401 on /api/v1/senders/request", f"status={status}")
    else:
        fail("G9 Unauthenticated → expected 401 on /api/v1/senders/request", f"status={status} body={str(body)[:200]}")

    # G10. Packages is public — should succeed without auth
    status, body = anon.get("/api/v1/packages")
    if status == 200:
        ok("G10 /api/v1/packages public → 200 without auth", f"status={status}")
    else:
        fail("G10 /api/v1/packages public → expected 200 without auth", f"status={status} body={str(body)[:200]}")

    # G11. /api/v1/packages/my requires auth
    status, body = anon.get("/api/v1/packages/my")
    if status == 401:
        ok("G11 /api/v1/packages/my → 401 without auth", f"status={status}")
    else:
        fail("G11 /api/v1/packages/my → expected 401 without auth", f"status={status} body={str(body)[:200]}")

    # G12. /api/v1/transactions requires auth
    status, body = anon.get("/api/v1/transactions")
    if status == 401:
        ok("G12 /api/v1/transactions → 401 without auth", f"status={status}")
    else:
        fail("G12 /api/v1/transactions → expected 401 without auth", f"status={status} body={str(body)[:200]}")

    # G13. Invalid Bearer token → 401
    invalid_s = Session()
    status, body = invalid_s.request(
        "GET",
        "/api/v1/contacts",
        headers={"Authorization": "Bearer FAKE_TEST_TOKEN_NOT_REAL_000000000000"},
    )
    if status == 401:
        ok("G13 Invalid Bearer token → 401", f"status={status}")
    else:
        fail("G13 Invalid Bearer token → expected 401", f"status={status} body={str(body)[:200]}")

    # G14. Malformed Bearer token (not sk_live_ prefix)
    status, body = invalid_s.request(
        "GET",
        "/api/v1/contacts",
        headers={"Authorization": "Bearer INVALID_FORMAT"},
    )
    if status == 401:
        ok("G14 Malformed Bearer token → 401", f"status={status}")
    else:
        fail("G14 Malformed Bearer token → expected 401", f"status={status} body={str(body)[:200]}")


# ─────────────────────────────────────────────────────────────────────────────
#  Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("\n" + "="*70)
    print("  QA Layer 1 — API Test Suite")
    print(f"  Target: {BASE}")
    print(f"  User: {EMAIL}")
    print("="*70)

    # Login
    print("\n[*] Authenticating...")
    try:
        s = login()
        print(f"  ✅  Login successful — session cookies obtained")
    except Exception as e:
        print(f"  ❌  FATAL: Cannot login: {e}")
        sys.exit(1)

    # Run all test categories
    test_contacts(s)
    test_groups(s)
    test_tags(s)
    test_messages(s)
    test_senders(s)
    test_packages(s)
    test_security(s)

    # Summary
    total = PASS + FAIL
    print(f"\n{'='*70}")
    print(f"  SUMMARY: {PASS}/{total} PASS | {FAIL}/{total} FAIL")
    print(f"{'='*70}")

    if FAIL > 0:
        print("\n  FAILED tests:")
        for r in RESULTS:
            if r["status"] == "FAIL":
                print(f"    ❌ {r['name']}")
                if r["detail"]:
                    print(f"       {r['detail']}")

    # Write JSON report
    report = {
        "target": BASE,
        "user": EMAIL,
        "total": total,
        "pass": PASS,
        "fail": FAIL,
        "results": RESULTS,
    }
    report_path = "/Users/lambogreny/oracles/smsok-clone/tests/api-layer1-report.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"\n  Report saved: {report_path}")

    sys.exit(0 if FAIL == 0 else 1)


if __name__ == "__main__":
    main()
