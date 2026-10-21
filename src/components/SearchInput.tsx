import { CloseIcon, SearchIcon } from './icons';

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  large?: boolean;
};

export function SearchInput({
  value,
  onChange,
  placeholder = 'Cari channel…',
  large = false,
}: SearchInputProps) {
  return (
    <div className="relative w-full">
      <SearchIcon
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${
          large
            ? 'left-6 h-6 w-6 text-white'
            : 'left-3.5 h-4.5 w-4.5 text-slate-500'
        }`}
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Cari channel"
        enterKeyHint="search"
        className={`text-slate-100 placeholder:text-slate-500 transition-colors outline-none focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden ${
          large
            ? 'w-full rounded-full border border-white/10 bg-ink-850 py-5 pr-7 pl-16 text-lg font-medium hover:border-white/15 focus:border-accent-400/60 focus:bg-ink-800'
            : 'h-10.5 w-full rounded-xl border border-white/8 bg-ink-850 pr-9 pl-10.5 text-sm hover:border-white/15 focus:border-accent-400/60 focus:bg-ink-800'
        }`}
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Hapus pencarian"
          className={`absolute top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-white ${
            large ? 'right-4' : 'right-2'
          }`}
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
