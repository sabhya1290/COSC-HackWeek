// src/utils/categories.js
// Student-focused expense categories with colours, Tailwind classes, and icon hints.

export const CATEGORIES = [
  { name: 'Mess & Food',      color: '#f97316', bg: 'bg-orange-100',  text: 'text-orange-600',  icon: 'UtensilsCrossed' },
  { name: 'Travel',           color: '#3b82f6', bg: 'bg-blue-100',    text: 'text-blue-600',    icon: 'TrainFront'      },
  { name: 'Hostel',           color: '#8b5cf6', bg: 'bg-violet-100',  text: 'text-violet-600',  icon: 'Building2'       },
  { name: 'Academics',        color: '#06b6d4', bg: 'bg-cyan-100',    text: 'text-cyan-600',    icon: 'BookOpen'        },
  { name: 'Subscriptions',    color: '#ec4899', bg: 'bg-pink-100',    text: 'text-pink-600',    icon: 'Tv2'             },
  { name: 'College Events',   color: '#f59e0b', bg: 'bg-amber-100',   text: 'text-amber-600',   icon: 'PartyPopper'     },
  { name: 'Shopping',         color: '#a855f7', bg: 'bg-purple-100',  text: 'text-purple-600',  icon: 'ShoppingBag'     },
  { name: 'Health',           color: '#10b981', bg: 'bg-emerald-100', text: 'text-emerald-600', icon: 'Heart'           },
  { name: 'Other',            color: '#6b7280', bg: 'bg-gray-100',    text: 'text-gray-600',    icon: 'MoreHorizontal'  },
];

export const getCategoryConfig = (name) =>
  CATEGORIES.find((c) => c.name === name) || CATEGORIES[CATEGORIES.length - 1];

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);
