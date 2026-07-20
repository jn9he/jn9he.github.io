import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  categories: string[];
  activeFilter: string;
  onFilterChange: (category: string) => void;
}

export default function CategoryFilter({ categories, activeFilter, onFilterChange }: Props) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="category-filter"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Popup that expands upward on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="category-filter__popup"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <button
              className={`category-filter__option ${activeFilter === 'All' ? 'is-active' : ''}`}
              onClick={() => onFilterChange('All')}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                className={`category-filter__option ${activeFilter === cat ? 'is-active' : ''}`}
                onClick={() => onFilterChange(cat)}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger button */}
      <div className="category-filter__trigger">
        <span className="category-filter__label">
          {activeFilter === 'All' ? 'Choose Category' : activeFilter}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`category-filter__icon ${isHovered ? 'is-open' : ''}`}
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </div>
    </div>
  );
}
