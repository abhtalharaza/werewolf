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
    color: '#a855f7',
    bgGradient: 'from-purple-900/60 to-zinc-900',
    svgIcon: 'Scroll',
  },
  {
    id: 'hunter',
    name: 'Garrick',
    title: 'Forester',
    color: '#10b981',
    bgGradient: 'from-emerald-950/70 to-zinc-900',
    svgIcon: 'Crosshair',
  },
  {
    id: 'sorceress',
    name: 'Morrigan',
    title: 'Occultist',
    color: '#ec4899',
    bgGradient: 'from-pink-950/70 to-zinc-900',
    svgIcon: 'Sparkles',
  },
  {
    id: 'blacksmith',
    name: 'Torvald',
    title: 'Ironmonger',
    color: '#f97316',
    bgGradient: 'from-amber-950/70 to-zinc-900',
    svgIcon: 'Flame',
  },
  {
    id: 'priestess',
    name: 'Seraphina',
    title: 'Acolyte',
    color: '#06b6d4',
    bgGradient: 'from-cyan-950/70 to-zinc-900',
    svgIcon: 'Sun',
  },
  {
    id: 'rogue',
    name: 'Corvus',
    title: 'Shadow-Walker',
    color: '#64748b',
    bgGradient: 'from-slate-900 to-zinc-900',
    svgIcon: 'Moon',
  },
  {
    id: 'knight',
    name: 'Valerius',
    title: 'Paladin',
    color: '#3b82f6',
    bgGradient: 'from-blue-950/70 to-zinc-900',
    svgIcon: 'Shield',
  },
  {
    id: 'herbalist',
    name: 'Althea',
    title: 'Botanist',
    color: '#84cc16',
    bgGradient: 'from-lime-950/70 to-zinc-900',
    svgIcon: 'Flower2',
  },
  {
    id: 'bard',
    name: 'Finnegan',
    title: 'Minstrel',
    color: '#eab308',
    bgGradient: 'from-yellow-950/70 to-zinc-900',
    svgIcon: 'Music',
  },
  {
    id: 'gravedigger',
    name: 'Mortimer',
    title: 'Sexton',
    color: '#71717a',
    bgGradient: 'from-zinc-800 to-zinc-950',
    svgIcon: 'Skull',
  },
];

export function getAvatar(id: string): AvatarOption {
  return AVATARS.find((a) => a.id === id) || AVATARS[0];
}
