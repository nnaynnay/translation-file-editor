export type TranslationNote =
  | {
    type: 'note';
    content: string;
    from?: string;      // XLIFF 1.2 (e.g. description/meaning)
    priority?: number;  // XLIFF 1.2
    category?: string;  // XLIFF 2.0
  }
  | {
    type: 'location';
    content: string;    // Combined string (e.g. "file:line")
    sourcefile?: string;
    linenumber?: string;
    category?: string;  // XLIFF 2.0
    purpose?: string;   // XLIFF 1.2 (location)
  };

export interface TranslationUnit {
  id: string;
  source: string;
  target: string;
  notes?: TranslationNote[];
  state?: string; // e.g. 'translated', 'needs-review', etc. (from target state attr)
}
