export const SECTIONS = [
  { id: "index", label: "Index", index: "01" },
  { id: "work", label: "Selected Work", index: "02" },
  { id: "about", label: "About", index: "03" },
  { id: "contact", label: "Contact", index: "04" },
  { id: "archive", label: "Archive", index: "05" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

export const SECTION_IDS: string[] = SECTIONS.map((s) => s.id);

export function getSection(id: string) {
  return SECTIONS.find((s) => s.id === id) ?? SECTIONS[0];
}
