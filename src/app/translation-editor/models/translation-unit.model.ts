export interface TranslationUnit {
  id: string;
  source: string;
  target: string;
  note?: string;
  state?: string; // e.g. 'translated', 'needs-review', etc. (from target state attr)
}
