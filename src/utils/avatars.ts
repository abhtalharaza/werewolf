export interface AvatarOption {
  id: string;
  name: string;
  title: string;
  color: string;
  bgGradient: string;
  svgIcon: string;
}

export const AVATARS: AvatarOption[] = [
  {
    id: 'elder',
    name: 'Eldred',
    title: 'Village Elder',
    color: '#8b5cf6',
    bgGradient: 'from-purple-600 to-indigo-700',
    svgIcon: 'Scroll',
  },
  {
    id: 'hunter',
    name: 'Garrick',
    title: 'Forester',
    color: '#0284c7',
    bgGradient: 'from-sky-500 to-indigo-600',
    svgIcon: 'Crosshair',
  },
  {
    id: 'sorceress',
    name: 'Morrigan',
    title: 'Occultist',
    color: '#ec4899',
    bgGradient: 'from-pink-500 to-purple-700',
    svgIcon: 'Sparkles',
  },
  {
    id: 'blacksmith',
    name: 'Torvald',
    title: 'Ironmonger',
    color: '#f97316',
    bgGradient: 'from-amber-500 to-rose-600',
    svgIcon: 'Flame',
  },
  {
    id: 'priestess',
    name: 'Seraphina',
    title: 'Acolyte',
    color: '#06b6d4',
    bgGradient: 'from-cyan-500 to-blue-600',
    svgIcon: 'Sun',
  },
  {
    id: 'rogue',
    name: 'Corvus',
    title: 'Shadow-Walker',
    color: '#6366f1',
    bgGradient: 'from-slate-700 to-indigo-900',
    svgIcon: 'Moon',
  },
  {
    id: 'knight',
    name: 'Valerius',
    title: 'Paladin',
    color: '#3b82f6',
    bgGradient: 'from-blue-500 to-indigo-700',
    svgIcon: 'Shield',
  },
  {
    id: 'herbalist',
    name: 'Althea',
    title: 'Botanist',
    color: '#14b8a6',
    bgGradient: 'from-teal-500 to-cyan-600',
    svgIcon: 'Flower2',
  },
  {
    id: 'bard',
    name: 'Finnegan',
    title: 'Minstrel',
    color: '#eab308',
    bgGradient: 'from-amber-400 to-orange-500',
    svgIcon: 'Music',
  },
  {
    id: 'gravedigger',
    name: 'Mortimer',
    title: 'Sexton',
    color: '#64748b',
    bgGradient: 'from-slate-600 to-slate-800',
    svgIcon: 'Skull',
  },
];

export function getAvatar(id: string): AvatarOption {
  return AVATARS.find((a) => a.id === id) || AVATARS[0];
}
