export interface PresetListItem {
  key: string;
  label: string;
  emoji: string;
}

interface Props {
  term: string;
  items: PresetListItem[];
  selectedKey: string | null;
  onSelectNew: () => void;
  onSelectItem: (item: PresetListItem) => void;
}

export const CREATE_NEW_KEY = "__new__";

// A scrollable pick list shared by Requests, Tasks, and Rewards: "Create
// New {term}" always sits first so typing something from scratch is never
// buried below a long list of presets.
export function PresetList({ term, items, selectedKey, onSelectNew, onSelectItem }: Props) {
  return (
    <div className="max-h-56 divide-y divide-neutral-100 overflow-y-auto rounded-lg border border-neutral-200">
      <button
        type="button"
        onClick={onSelectNew}
        className={`font-display flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold ${
          selectedKey === CREATE_NEW_KEY ? "bg-brand-light text-brand-dark" : "text-brand"
        }`}
      >
        <span className="text-lg">➕</span> Create new {term}
      </button>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onSelectItem(item)}
          className={`font-body flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm ${
            selectedKey === item.key ? "bg-brand-light text-brand-dark font-semibold" : "text-neutral-700"
          }`}
        >
          <span className="text-lg">{item.emoji}</span> {item.label}
        </button>
      ))}
    </div>
  );
}
