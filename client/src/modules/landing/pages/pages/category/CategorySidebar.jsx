import { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { Link } from 'react-router-dom';

const cn = (...classes) => classes.filter(Boolean).join(' ');

// const slugify = (text) =>
//   typeof text === 'string'
//     ? text
//         .toLowerCase()
//         .replace(/&/g, 'and')
//         .replace(/[^a-z0-9]+/g, '-')
//         .replace(/^-+|-+$/g, '')
//     : '';

const getIconByCategoryName = (name = '') => {
  const lower = name.toLowerCase();
  if (lower.includes('electronics')) return LucideIcons.Monitor;
  if (lower.includes('fashion') || lower.includes('clothing')) return LucideIcons.Shirt;
  if (lower.includes('mobile')) return LucideIcons.Smartphone;
  if (lower.includes('furniture')) return LucideIcons.Chair;
  if (lower.includes('beauty')) return LucideIcons.Sparkles;
  if (lower.includes('book')) return LucideIcons.Book;
  if (lower.includes('sports')) return LucideIcons.Dumbbell;
  if (lower.includes('food') || lower.includes('grocery')) return LucideIcons.Apple;
  if (lower.includes('toy')) return LucideIcons.Puzzle;
  if (lower.includes('automobile') || lower.includes('car')) return LucideIcons.Car;
  if (lower.includes('home')) return LucideIcons.Home;
  if (lower.includes('all categories')) return LucideIcons.Layers;
  return LucideIcons.Box;
};

const CategorySidebar = ({ categories = [], onHover, onLeave, selectedId }) => {
  const [isTouchActive, setIsTouchActive] = useState(false);

  const handleTouchStart = (cat) => {
    if (isTouchActive && cat === null) {
      onLeave();
      setIsTouchActive(false);
    } else {
      onHover(cat);
      setIsTouchActive(true);
    }
  };

  return (
    <div className="bg-white p-4 w-[250px] border border-gray-200 h-auto">
      <h3 className="font-bold mb-4 text-[#0c1f4d]">Top Categories</h3>
      <ul className="space-y-2">
        {Array.isArray(categories) &&
          categories.map((cat) => {
            const Icon = getIconByCategoryName(cat.categoryName);
            const slug = cat.categoryName
            const isAllCategories = cat.categoryId === 'all';

            return (
              <li
                key={cat.categoryId}
                className={cn(
                  'cursor-pointer text-black border-b border-gray-200 rounded transition hover:bg-gray-100',
                  selectedId === cat.categoryId && 'bg-blue-200'
                )}
                onMouseEnter={() => onHover(cat)}
                onMouseLeave={() => !isTouchActive && onLeave()}
                onTouchStart={() => handleTouchStart(cat)}
              >
                <Link
                  to={isAllCategories ? '/all-categories' : `/all-categories/${slug}`}
                  className="flex items-center gap-2 py-[5px] px-2"
                >
                  <Icon size={18} className="text-[#0c1f4d]" />
                  <span className="text-sm truncate max-w-[100px] block">
                    {cat.categoryName}
                  </span>
                </Link>
              </li>
            );
          })}
      </ul>
    </div>
  );
};

export default CategorySidebar;