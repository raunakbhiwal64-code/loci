import type {
  ContentItem,
  DailyChallengeResult,
  Profile,
  SkillId,
  SkillProgress,
  SrsItem,
} from "@loci/module-sdk";
import type { ProgressionStore } from "@loci/core-progression";
import type { SrsStore } from "@loci/core-srs";
import { createPersistence, type Persistence } from "./persistence.js";

/**
 * Local-first data layer. All of a device's small dataset is held in memory for
 * synchronous reads (one child at a time, tiny footprint) and written through to
 * durable storage. This keeps the deterministic engines (sync) simple while
 * satisfying the IndexedDB persistence requirement (PRD 5.3 / Appendix E).
 */

interface Snapshot {
  profiles: Record<string, Profile>;
  skills: Record<string, SkillProgress>; // key: `${profileId}:${skillId}`
  srs: Record<string, SrsItem>;
  daily: Record<string, DailyChallengeResult>; // key: `${profileId}:${dateKey}`
  content: Record<string, ContentItem>;
  activeProfileId: string | null;
}

const empty: Snapshot = {
  profiles: {},
  skills: {},
  srs: {},
  daily: {},
  content: {},
  activeProfileId: null,
};

export function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function dateKey(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export class LocalStore {
  private data: Snapshot = structuredClone(empty);
  private persistence: Persistence;

  constructor(persistence: Persistence = createPersistence()) {
    this.persistence = persistence;
  }

  async init(): Promise<void> {
    const loaded = await this.persistence.loadAll();
    this.data = { ...structuredClone(empty), ...(loaded as Partial<Snapshot>) };
    await this.persistence.requestPersistent();
  }

  private flush(collection: keyof Snapshot) {
    // fire-and-forget write-through; durability handled by persistence layer.
    void this.persistence.save(collection, this.data[collection]);
  }

  /* ---- profiles ---- */
  listProfiles(): Profile[] {
    return Object.values(this.data.profiles).sort((a, b) => a.createdAt - b.createdAt);
  }
  getProfile(id: string): Profile | undefined {
    return this.data.profiles[id];
  }
  activeProfile(): Profile | undefined {
    return this.data.activeProfileId ? this.data.profiles[this.data.activeProfileId] : undefined;
  }
  setActiveProfile(id: string) {
    this.data.activeProfileId = id;
    this.flush("activeProfileId");
  }
  createProfile(p: Omit<Profile, "id" | "createdAt">): Profile {
    const profile: Profile = { ...p, id: uuid(), createdAt: Date.now() };
    this.data.profiles[profile.id] = profile;
    this.data.activeProfileId = profile.id;
    this.flush("profiles");
    this.flush("activeProfileId");
    return profile;
  }
  deleteProfile(id: string) {
    // deleting a profile deletes everything keyed to it (PRD Appendix E).
    delete this.data.profiles[id];
    for (const k of Object.keys(this.data.skills)) if (k.startsWith(id + ":")) delete this.data.skills[k];
    for (const k of Object.keys(this.data.srs)) if (this.data.srs[k].profileId === id) delete this.data.srs[k];
    for (const k of Object.keys(this.data.daily)) if (k.startsWith(id + ":")) delete this.data.daily[k];
    if (this.data.activeProfileId === id) this.data.activeProfileId = this.listProfiles()[0]?.id ?? null;
    (["profiles", "skills", "srs", "daily", "activeProfileId"] as (keyof Snapshot)[]).forEach((c) => this.flush(c));
  }

  /* ---- daily challenge ---- */
  getDaily(profileId: string, key: string): DailyChallengeResult | undefined {
    return this.data.daily[`${profileId}:${key}`];
  }
  putDaily(r: DailyChallengeResult): void {
    this.data.daily[`${r.profileId}:${r.dateKey}`] = r;
    this.flush("daily");
  }
  /** Current streak of consecutive days ending today for a profile. */
  streak(profileId: string, today = new Date()): number {
    let n = 0;
    const d = new Date(today);
    for (;;) {
      const r = this.getDaily(profileId, dateKey(d));
      if (r?.completed) {
        n++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return n;
  }

  /* ---- content store ---- */
  putContent(item: ContentItem): void {
    this.data.content[item.id] = item;
    this.flush("content");
  }
  getContent(id: string): ContentItem | undefined {
    return this.data.content[id];
  }

  /* ---- engine store adapters ---- */
  progressionStore(): ProgressionStore {
    return {
      read: (profileId, skillId) => this.data.skills[`${profileId}:${skillId}`],
      write: (p) => {
        this.data.skills[`${p.profileId}:${p.skillId}`] = p;
        this.flush("skills");
      },
      readAll: (profileId) =>
        Object.values(this.data.skills).filter((s) => s.profileId === profileId),
    };
  }

  srsStore(): SrsStore {
    return {
      read: (id) => this.data.srs[id],
      write: (item) => {
        this.data.srs[item.id] = item;
        this.flush("srs");
      },
      readDue: (profileId, now, moduleId) =>
        Object.values(this.data.srs)
          .filter((i) => i.profileId === profileId && i.dueAt <= now && (!moduleId || i.moduleId === moduleId))
          .sort((a, b) => a.dueAt - b.dueAt),
      findByRef: (profileId, moduleId, payloadRef) =>
        Object.values(this.data.srs).find(
          (i) => i.profileId === profileId && i.moduleId === moduleId && i.payloadRef === payloadRef
        ),
    };
  }
}

export type { SkillId, SkillProgress };
export { createPersistence } from "./persistence.js";
