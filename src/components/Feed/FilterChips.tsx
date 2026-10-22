import './FilterChips.css';

interface FilterChipsProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function FilterChips({ categories, selectedCategory, onSelectCategory }: FilterChipsProps) {
  return (
    <div className="chips-bar-wrapper">
      {categories.map((cat) => (
        <button
          key={cat}
          className={`chip-btn ${selectedCategory === cat ? 'active' : ''}`}
          onClick={() => onSelectCategory(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
