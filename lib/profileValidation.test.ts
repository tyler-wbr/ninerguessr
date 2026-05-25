import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateDisplayName,
  validateEmail,
  validatePersonName,
  validateRegistrationFields,
} from "./profileValidation";

describe("validatePersonName", () => {
  it("accepts normal names", () => {
    const r = validatePersonName("Tyler", "First name");
    assert.equal(r.ok, true);
  });

  it("rejects empty names", () => {
    const r = validatePersonName("  ", "First name");
    assert.equal(r.ok, false);
  });

  it("rejects digits in names", () => {
    const r = validatePersonName("John2", "First name");
    assert.equal(r.ok, false);
  });
});

describe("validateDisplayName", () => {
  it("accepts valid display names", () => {
    assert.equal(validateDisplayName("NinerFan42").ok, true);
    assert.equal(validateDisplayName("Tyler W").ok, true);
  });

  it("rejects short names", () => {
    const r = validateDisplayName("ab");
    assert.equal(r.ok, false);
  });

  it("rejects numbers only", () => {
    const r = validateDisplayName("12345");
    assert.equal(r.ok, false);
  });

  it("rejects profanity", () => {
    const r = validateDisplayName("badword_fuck");
    assert.equal(r.ok, false);
  });

  it("rejects names without letters", () => {
    const r = validateDisplayName("123_456");
    assert.equal(r.ok, false);
  });
});

describe("validateEmail", () => {
  it("accepts valid emails", () => {
    const r = validateEmail("user@example.com");
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.value, "user@example.com");
  });

  it("rejects invalid emails", () => {
    assert.equal(validateEmail("not-an-email").ok, false);
  });
});

describe("validateRegistrationFields", () => {
  it("returns all field errors when empty", () => {
    const r = validateRegistrationFields({
      firstName: "",
      lastName: "",
      displayName: "",
      email: "",
      password: "",
    });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.ok(r.errors.firstName);
      assert.ok(r.errors.lastName);
      assert.ok(r.errors.displayName);
      assert.ok(r.errors.email);
      assert.ok(r.errors.password);
    }
  });
});
