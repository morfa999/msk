export type SoundCategory = 'All' | 'Drums' | 'Melodies' | '808s' | 'FX' | 'Vocals' | 'Loops' | 'Готовые биты';

export const categories: SoundCategory[] = ['All', 'Drums', 'Melodies', '808s', 'FX', 'Vocals', 'Loops', 'Готовые биты'];

// Categories for adding sounds (without 'All')
export const soundCategories = ['Drums', 'Melodies', '808s', 'FX', 'Vocals', 'Loops', 'Готовые биты'];

export const sortOptions = [
  { label: 'Новые', value: 'newest' },
  { label: 'Популярные', value: 'downloads' },
  { label: 'По имени А-Я', value: 'name' },
] as const;
