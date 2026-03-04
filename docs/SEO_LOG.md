# SEO Log — Balitrusted

Документ для учёта семантического ядра, привязки страниц к запросам и истории SEO-изменений.

---

## 1. Семантическое ядро (целевые запросы)

### Главная страница (homepage)
| Запрос | Тип | Статус |
|--------|-----|--------|
| bali villas for rent | Основной | ✅ В работе |
| bali villa rentals | Вариация | |
| villas for rent in bali | Вариация | |
| long term villas bali | Вариация | |

### Районы (area pages)
| Запрос | Страница/URL | Статус |
|--------|----------------|--------|
| ubud villas (rent) | /properties/rent/ubud | |
| sanur villas | /properties/rent/sanur | |
| seminyak villas | /properties/rent/seminyak | |
| canggu villas | /properties/rent/canggu | |

### Другие страницы
_(добавлять по мере оптимизации)_

---

## 2. Привязка страниц к запросам

| URL | Основной ключ | Title | H1 | Оптимизировано |
|-----|----------------|-------|-----|----------------|
| / | bali villas for rent | Bali Villas for Rent – Trusted Long Term Villa Rentals \| Balitrusted | Trusted Villas for Rent in Bali | 2025-02-xx |
| /properties | — | Property Catalog | — | |
| /properties/rent/ubud | villas for rent ubud | Rent Villas in Ubud | — | |
| /guides | — | Knowledge Base | — | |

_(обновлять при добавлении/изменении страниц)_

---

## 3. История изменений (changelog)

### 2025-02-xx — Главная страница (SEO-рефакторинг)
- **Было:** Title "Real Estate in Bali — Long-term Rentals and Investments"; H1 "Real Estate in Bali for Long-term Living and Investments"; блоки Hero, For Whom, How We Differ, Start Here.
- **Сделано:**  
  - Title: Bali Villas for Rent – Trusted Long Term Villa Rentals (шаблон добавляет " | Balitrusted").  
  - Meta description: 150–160 символов под основной ключ.  
  - H1: один, "Trusted Villas for Rent in Bali".  
  - Добавлен блок Popular Areas (Ubud, Sanur, Seminyak, Canggu).  
  - Внизу страницы добавлен SEO-текст ~250–400 слов.  
  - Структура: Hero → Popular Areas → Start Here → For Whom → How We Differ → SEO text.
- **Откат:** `git checkout app/page.tsx` до коммита перед изменениями (или восстановить из этого лога).

---

## 4. Задачи и идеи (backlog)

- [ ] Проверить и при необходимости дооптимизировать title/description страниц каталога по районам.
- [ ] Добавить/обновить семантику для статей Knowledge Base по мере публикации.
- [ ] Ссылки с главной на популярные районы (Popular Areas) — сделано.

---

_При внесении изменений обновляй этот файл: добавляй запросы в п.1, строки в п.2 и запись в п.3._
