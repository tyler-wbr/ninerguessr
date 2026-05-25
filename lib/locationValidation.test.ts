import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isLocationComplete,
  validateLocationWrite,
} from "./locationValidation";

describe("isLocationComplete", () => {
  it("returns false for drafts", () => {
    assert.equal(
      isLocationComplete({ image_path: null, lat: null, lng: null }),
      false,
    );
  });

  it("returns true when photo and coords exist", () => {
    assert.equal(
      isLocationComplete({
        image_path: "user/abc.jpg",
        lat: 35.3,
        lng: -80.73,
      }),
      true,
    );
  });
});

describe("validateLocationWrite", () => {
  it("allows draft create with title only", () => {
    const r = validateLocationWrite({
      difficulty: "easy",
      title: "Student Union",
      is_published: false,
    });
    assert.equal(r.ok, true);
  });

  it("rejects publishing incomplete locations", () => {
    const r = validateLocationWrite({
      is_published: true,
    });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.match(r.error, /Publish requires/);
    }
  });

  it("rejects photo without coordinates", () => {
    const r = validateLocationWrite({
      image_path: "user/abc.jpg",
      lat: null,
      lng: null,
    });
    assert.equal(r.ok, false);
  });

  it("merges with existing record on patch", () => {
    const r = validateLocationWrite(
      { is_published: true },
      {
        image_path: "user/abc.jpg",
        lat: 35.3,
        lng: -80.73,
        is_published: false,
      },
    );
    assert.equal(r.ok, true);
  });
});
