import { describe, expect, it, vi } from "vitest";
import {
  addCompareName,
  COMPARE_STORAGE_KEY,
  MAX_COMPARE_NAMES,
  readCompareNames,
  removeCompareName,
  writeCompareNames,
} from "@/coveo/compareStorage";

function fakeStorage(initial: Record<string, string> = {}): Storage {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: () => null,
    length: store.size,
  } as Storage;
}

describe("readCompareNames", () => {
  it("returns an empty array when nothing is stored", () => {
    expect(readCompareNames(fakeStorage())).toEqual([]);
  });

  it("parses a stored JSON array of names", () => {
    const storage = fakeStorage({ [COMPARE_STORAGE_KEY]: JSON.stringify(["Pikachu", "Eevee"]) });
    expect(readCompareNames(storage)).toEqual(["Pikachu", "Eevee"]);
  });

  it("drops non-string entries rather than throwing", () => {
    const storage = fakeStorage({ [COMPARE_STORAGE_KEY]: JSON.stringify(["Pikachu", 5, null]) });
    expect(readCompareNames(storage)).toEqual(["Pikachu"]);
  });

  it("returns an empty array for malformed JSON instead of throwing", () => {
    const storage = fakeStorage({ [COMPARE_STORAGE_KEY]: "{not json" });
    expect(readCompareNames(storage)).toEqual([]);
  });

  it("returns an empty array when the stored value isn't an array", () => {
    const storage = fakeStorage({ [COMPARE_STORAGE_KEY]: JSON.stringify({ a: 1 }) });
    expect(readCompareNames(storage)).toEqual([]);
  });

  it("never throws even if getItem itself throws (private browsing)", () => {
    const storage = {
      getItem: () => {
        throw new Error("SecurityError");
      },
    } as unknown as Storage;
    expect(readCompareNames(storage)).toEqual([]);
  });
});

describe("writeCompareNames", () => {
  it("serializes the names array under the one storage key", () => {
    const storage = fakeStorage();
    const setItem = vi.spyOn(storage, "setItem");
    writeCompareNames(storage, ["Bulbasaur"]);
    expect(setItem).toHaveBeenCalledWith(COMPARE_STORAGE_KEY, JSON.stringify(["Bulbasaur"]));
  });

  it("never throws even if setItem itself throws (private browsing/quota)", () => {
    const storage = {
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    } as unknown as Storage;
    expect(() => writeCompareNames(storage, ["Bulbasaur"])).not.toThrow();
  });
});

describe("addCompareName", () => {
  it("appends a new name", () => {
    expect(addCompareName(["Pikachu"], "Eevee")).toEqual(["Pikachu", "Eevee"]);
  });

  it("is a no-op if the name is already selected", () => {
    expect(addCompareName(["Pikachu"], "Pikachu")).toEqual(["Pikachu"]);
  });

  it("is a no-op once the cap is reached, never adding a 5th entry", () => {
    const full = Array.from({ length: MAX_COMPARE_NAMES }, (_, i) => `Pokemon${i}`);
    expect(addCompareName(full, "OneTooMany")).toEqual(full);
  });
});

describe("removeCompareName", () => {
  it("removes a matching name", () => {
    expect(removeCompareName(["Pikachu", "Eevee"], "Pikachu")).toEqual(["Eevee"]);
  });

  it("is a no-op if the name isn't present", () => {
    expect(removeCompareName(["Pikachu"], "Eevee")).toEqual(["Pikachu"]);
  });
});
