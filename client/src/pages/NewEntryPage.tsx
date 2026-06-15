import type { Entry } from "../types";
import { EntryForm } from "../components/EntryForm";

interface NewEntryPageProps {
  onRefresh: (entry?: Entry) => Promise<void>;
}

export function NewEntryPage({ onRefresh }: NewEntryPageProps) {
  return (
    <div className="mx-auto max-w-4xl pt-24">
      <EntryForm onSaved={onRefresh} />
    </div>
  );
}
