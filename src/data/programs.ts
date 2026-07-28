import { Program } from '@/types';

export const programs: Program[] = [
  {
    id: 'psychology-fulltime',
    name: 'Психология',
    form: 'Очная',
    places: 10,
    keywords: ['Психология', 'Очная'],
  },
  {
    id: 'psychology-parttime',
    name: 'Психология',
    form: 'Очно-Заочная',
    places: 6,
    keywords: ['Психология', 'Очно-Заочная'],
  },
  {
    id: 'management-fulltime',
    name: 'Менеджмент',
    form: 'Очная',
    places: 20,
    keywords: ['Менеджмент', 'Очная'],
  },
  {
    id: 'socialwork-fulltime',
    name: 'Социальная работа',
    form: 'Очная',
    places: 10,
    keywords: ['Социальная работа', 'Очная'],
  },
  {
    id: 'socialwork-distance',
    name: 'Социальная работа',
    form: 'Заочная',
    places: 10,
    keywords: ['Социальная работа', 'Заочная'],
  },
  {
    id: 'law-fulltime',
    name: 'Юриспруденция',
    form: 'Очная',
    places: 10,
    keywords: ['Юриспруденция', 'Очная'],
  },
];
