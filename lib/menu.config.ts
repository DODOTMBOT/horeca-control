export const MENU = [
  { slug: "/dashboard", label: "Дашборд", system: false },
  { slug: "/labeling", label: "Маркировки", system: false },
  { slug: "/files", label: "Файлы", system: false },
  { slug: "/learning", label: "Обучение", system: false },
  { slug: "/haccp", label: "Журналы ХАССП", system: false },
  { slug: "/medical-books", label: "Медицинские книжки", system: false },
  { slug: "/schedule-salary", label: "График и зарплата", system: false },
  { slug: "/employees", label: "Мои сотрудники", system: false },
  { slug: "/equipment", label: "Мое оборудование", system: false },
  { slug: "/billing", label: "Биллинг", system: false },
  { slug: "/owner", label: "Владение", system: true }, // системная страница
  { slug: "/owner/users", label: "Пользователи", system: true }, // системная страница
  { slug: "/partner", label: "Партнёры", system: false },
  { slug: "/partner/points", label: "Мои точки", system: false },
] as const;

export type MenuItem = typeof MENU[number];
