import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Layers,
  ShoppingCart,
  MapPin,
  ClipboardList,
  Star,
  MessageSquare,
  Wallet,
  Settings,
  Calendar,
  Image,
  Flame,
  BookOpen,
  Search,
} from 'lucide-react';

const searchableRoutes = [
  {
    category: 'Main',
    items: [
      { name: 'Dashboard', path: '/merchant/dashboard', icon: <Layers size={18} /> },
      { name: 'Products', path: '/merchant/products', icon: <ShoppingCart size={18} /> },
      { name: 'Branches', path: '/merchant/branches', icon: <MapPin size={18} /> },
      { name: 'SEA Requirement', path: '/merchant/sea-requirement', icon: <ClipboardList size={18} /> },
      { name: 'Wallet', path: '/merchant/wallet', icon: <Wallet size={18} /> },
      { name: 'Settings', path: '/merchant/settings', icon: <Settings size={18} /> },
    ],
  },
  {
    category: 'Others',
    items: [
      { name: 'Reviews', path: '/merchant/reviews', icon: <Star size={18} /> },
      { name: 'Queries', path: '/merchant/queries', icon: <MessageSquare size={18} /> },
    ],
  },
  {
    category: 'Plans',
    items: [
      { name: 'Plan Subscription', path: '/merchant/plans/subscription', icon: <Calendar size={18} /> },
      { name: 'Banner', path: '/merchant/plans/banner', icon: <Image size={18} /> },
      { name: 'Trending', path: '/merchant/plans/trending', icon: <Flame size={18} /> },
      { name: 'E-Book', path: '/merchant/plans/e-book', icon: <BookOpen size={18} /> },
    ],
  },
];

const MerchantSearchCommand = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (path) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center space-x-2 px-3 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline-flex">Search...</span>
        <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground">
          <span className="text-xs"></span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command className="rounded-lg border shadow-md">
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            {searchableRoutes.map((group) => (
              <React.Fragment key={group.category}>
                <CommandGroup heading={group.category}>
                  {group.items.map((item) => (
                    <CommandItem
                      key={item.path}
                      onSelect={() => handleSelect(item.path)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </React.Fragment>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
};

export default MerchantSearchCommand;
