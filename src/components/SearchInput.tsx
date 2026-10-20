import { CloseIcon, SearchIcon } from './icons';

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchInput({
  value,
  onChange,
  placeholder = 'Cari channel…',
}: SearchInputProps) {
  return (
    <div className="relative w-full">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-slate-500" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Cari channel"
        enterKeyHint="search"
        className="h-10.5 w-full rounded-xl border border-white/8 bg-ink-850 pr-9 pl-10.5 text-sm text-slate-100 placeholder:text-slate-500 transition-colors outline-none hover:border-white/15 focus:border-accent-400/60 focus:bg-ink-800 focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Hapus pencarian"
          className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
