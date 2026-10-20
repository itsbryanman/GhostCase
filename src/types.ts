export type Format = "json" | "csv" | "text";
export type Rule = { id: string; kind: "json" | "csv" | "regex"; selector: string; action: "remove" | "fictional_id" | "fictional_email" | "replace"; value?: string; entity?: string; preserve?: { length?: boolean; normalization?: "NFC" | "NFD" }; delimiter?: string; header?: boolean };
export type Policy = { version: 1; rules: Rule[]; csv?: Record<string, { delimiter: string; header: boolean }> };
export type FileInput = { name: string; content: string; format?: Format };
export type TransformRecord = { ruleId: string; file: string; count: number; preserved: string[]; warnings: string[] };
export type Manifest = { version: 1; createdAt: string; files: { name: string; format: Format; sha256: string; bytes: number }[]; transformations: TransformRecord[]; relationships: { entity: string; replacements: number; occurrences: number }[]; warnings: string[]; unsupported: string[]; privacyReview: "REQUIRED"; reproduction: { status: "NOT_RUN" | "PRESERVED" | "NOT_PRESERVED" | "INCONCLUSIVE"; detail?: string }; };
