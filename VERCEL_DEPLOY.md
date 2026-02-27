# Деплой на Vercel

Пошаговая инструкция по деплою сайта на Vercel с использованием Vercel Blob Storage для картинок.

---

## Подготовка

### 1. Установите зависимости

```bash
npm install
```

Это установит `@vercel/blob` для работы с хранилищем картинок.

---

## Деплой на Vercel (простой способ БЕЗ Git)

### Способ 1: Через Vercel CLI (рекомендуется, самый простой)

**Vercel CLI уже установлен!** Теперь просто:

1. **Войдите в Vercel:**
   ```bash
   vercel login
   ```
   Откроется браузер — войдите через GitHub/Google/Email.

2. **Задеплойте проект:**
   ```bash
   cd C:\Users\Professional\bali-realestate
   vercel
   ```
   
   Vercel спросит:
   - "Set up and deploy?" → нажмите **Y** (Yes)
   - "Which scope?" → выберите ваш аккаунт
   - "Link to existing project?" → **N** (No, создаём новый)
   - "What's your project's name?" → нажмите Enter (оставит `bali-realestate`)
   - "In which directory is your code located?" → нажмите Enter (текущая папка)
   - "Want to override the settings?" → **N** (No)

3. **После деплоя** Vercel даст ссылку вида `https://bali-realestate.vercel.app` — откройте её в браузере!

4. **Настройте переменные окружения** (см. Шаг 2 ниже)

5. **Настройте Blob Storage** (см. Шаг 3 ниже)

---

### Способ 2: Через GitHub (если хотите автоматические обновления)

Если у вас есть GitHub аккаунт и вы хотите, чтобы сайт обновлялся автоматически при каждом изменении кода:

1. Установите Git: https://git-scm.com/download/win
2. Создайте репозиторий на GitHub: https://github.com/new
3. Загрузите код:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/bali-realestate.git
   git push -u origin main
   ```
4. В Vercel Dashboard: "Add New..." → "Project" → импортируйте репозиторий

---

## Деплой на Vercel (продолжение)

### Шаг 1: Создайте аккаунт и проект

1. Зайдите на **https://vercel.com**
2. Войдите через GitHub/GitLab/Bitbucket (или создайте аккаунт)
3. Нажмите **"Add New..." → "Project"**
4. Импортируйте ваш репозиторий `bali-realestate`
5. Vercel автоматически определит Next.js — оставьте настройки по умолчанию

### Шаг 2: Настройте переменные окружения

В разделе **"Environment Variables"** добавьте:

| Переменная | Значение | Описание |
|------------|----------|----------|
| `ADMIN_PASSWORD` | Ваш сложный пароль | Пароль для входа в админку |
| `NEXT_PUBLIC_BASE_URL` | `https://yourdomain.vercel.app` | URL вашего сайта (или кастомный домен) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-XXXXXXXXXX` | ID Google Analytics (опционально) |

**Важно:** Не добавляйте `BLOB_READ_WRITE_TOKEN` вручную — он будет добавлен автоматически после настройки Blob Storage.

### Шаг 3: Настройте Vercel Blob Storage (для картинок)

1. В Vercel Dashboard откройте ваш проект
2. Перейдите в **"Storage"** (в боковом меню)
3. Нажмите **"Create Database"**
4. Выберите **"Blob"**
5. Назовите хранилище (например, `bali-images`)
6. Выберите регион (ближайший к вашим пользователям, например `iad1` для США)
7. Нажмите **"Create"**
8. После создания Vercel автоматически добавит переменную `BLOB_READ_WRITE_TOKEN` в Environment Variables

**Проверка:** После деплоя загрузите картинку через админку — она должна сохраниться в Blob Storage, а не в файловую систему.

### Шаг 4: Деплой

1. Нажмите **"Deploy"** в Vercel
2. Дождитесь завершения сборки (обычно 2–5 минут)
3. После успешного деплоя откройте ссылку вида `https://yourproject.vercel.app`

---

## Миграция существующих картинок

Если у вас уже есть картинки в `public/uploads/properties/`:

### Вариант 1: Загрузить через админку (рекомендуется)

1. После деплоя зайдите в админку
2. Откройте каждую виллу
3. Перезагрузите картинки через форму редактирования
4. Они автоматически попадут в Vercel Blob

### Вариант 2: Массовая загрузка через скрипт

Можно написать скрипт для миграции, но проще перезагрузить через админку.

---

## Настройка кастомного домена (опционально)

1. В Vercel Dashboard: **Settings → Domains**
2. Добавьте ваш домен (например, `balitrusted.com`)
3. Следуйте инструкциям Vercel для настройки DNS
4. Обновите `NEXT_PUBLIC_BASE_URL` на новый домен

---

## Проверка после деплоя

- [ ] Сайт открывается по ссылке Vercel
- [ ] Админка доступна по `/admin/login` (вход с новым паролем)
- [ ] Можно загрузить картинку через админку (проверьте, что она сохраняется в Blob)
- [ ] Google Analytics работает (если настроен)
- [ ] Все страницы открываются без ошибок

---

## Обновление сайта

После каждого `git push` в основную ветку Vercel автоматически пересоберёт и задеплоит сайт.

Для ручного деплоя:
1. В Vercel Dashboard: **Deployments**
2. Нажмите **"Redeploy"** на нужном деплое

---

## Troubleshooting

### Картинки не загружаются

- Проверьте, что Blob Storage создан и `BLOB_READ_WRITE_TOKEN` добавлен в Environment Variables
- Проверьте логи деплоя в Vercel Dashboard → Deployments → выберите деплой → Logs

### Ошибка "Unauthorized" при загрузке

- Убедитесь, что `ADMIN_PASSWORD` задан в Environment Variables
- Перезапустите деплой после изменения переменных

### Старые картинки не отображаются

- Старые картинки из `public/uploads` не будут доступны на Vercel (файловая система read-only)
- Перезагрузите их через админку, чтобы они попали в Blob Storage

---

## Стоимость

- **Vercel Hobby Plan** (бесплатно): подходит для большинства проектов
  - Неограниченные деплои
  - 100 GB bandwidth/месяц
  - Serverless Functions
  
- **Vercel Blob Storage**: 
  - Первые 1 GB бесплатно
  - Далее ~$0.15/GB/месяц
  - Для сайта с виллами обычно достаточно бесплатного тарифа

---

Готово! Ваш сайт должен быть доступен на Vercel. 🚀
