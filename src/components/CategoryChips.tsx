import { LIME_GRADIENT } from '../lib/theme';
import type { SelectOption } from './SearchableSelect';

type CategoryChipsProps = {
  categories: SelectOption[];
  activeGroup: string;
  onGroupSelect: (group: string) => void;
};

export function CategoryChips({
  categories,
  activeGroup,
  onGroupSelect,
}: CategoryChipsProps) {
  if (categories.length === 0) return null;

  const chips: { name: string }[] = [
    { name: 'Semua' },
    ...categories.map((category) => ({ name: category.label })),
  ];

  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {chips.map((chip) => {
        const active = chip.name === activeGroup;
        return (
          <button
            key={chip.name}
            type="button"
            onClick={() => onGroupSelect(active ? '' : chip.name)}
            aria-pressed={active}
            className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
              active
                ? `font-bold ${LIME_GRADIENT}`
                : 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            {chip.name}
          </button>
        );
      })}
    </div>
  );
}
