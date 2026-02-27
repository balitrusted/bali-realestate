# Как выложить сайт через GitHub и Vercel

Пошаговая инструкция для новичка.

---

## Часть 1. Установить Git

1. Откройте в браузере: **https://git-scm.com/download/win**
2. Скачайте **"Click here to download"** (64-bit).
3. Запустите установщик. Везде можно жать **Next** (можно оставить галочку **"Add Git to PATH"**).
4. В конце нажмите **Finish**.
5. **Закройте и снова откройте PowerShell** (или Cursor), чтобы подхватился Git.

Проверка: откройте PowerShell и введите:
```powershell
git --version
```
Должно показать что-то вроде `git version 2.43.0`. Если команда не найдена — перезапустите компьютер и попробуйте снова.

---

## Часть 2. Зарегистрироваться на GitHub (если ещё нет)

1. Откройте **https://github.com**
2. Нажмите **Sign up**.
3. Укажите email (можно корпоративный из Google Workspace), пароль, имя пользователя.
4. Подтвердите email и войдите в аккаунт.

---

## Часть 3. Создать репозиторий на GitHub

1. Войдите на **https://github.com**
2. Справа вверху нажмите **"+"** → **"New repository"**.
3. **Repository name:** введите `bali-realestate` (или любое имя).
4. **Public** оставьте выбранным.
5. **НЕ** ставьте галочки "Add a README" и "Add .gitignore" — репозиторий должен быть пустым.
6. Нажмите **"Create repository"**.

На следующей странице будет написано что-то вроде "…or push an existing repository from the command line". Оставьте эту страницу открытой — понадобится ссылка на репозиторий.

---

## Часть 4. Залить проект в этот репозиторий с компьютера

Откройте **PowerShell** и выполняйте команды **по очереди** (после каждой нажимайте Enter).

```powershell
cd C:\Users\Professional\bali-realestate
```

```powershell
git init
```

```powershell
git add .
```

```powershell
git status
```
(Должны появиться списком файлы проекта. Не должно быть папки `node_modules` и файла `.env` — они в .gitignore.)

```powershell
git commit -m "Initial commit: Balitrusted site"
```

Теперь нужно привязать ваш репозиторий на GitHub. Вместо `YOUR_USERNAME` подставьте **ваш логин на GitHub**, а вместо `bali-realestate` — **имя репозитория**, если создали с другим именем:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/bali-realestate.git
```

Пример: если логин `ilias-pro`, то команда будет:
```powershell
git remote add origin https://github.com/ilias-pro/bali-realestate.git
```

Переименуем ветку в `main` (если Git спросит про "default branch", можно выбрать main):

```powershell
git branch -M main
```

Отправляем код на GitHub:

```powershell
git push -u origin main
```

GitHub попросит войти (логин и пароль или токен). Если просит **пароль** — в новых настройках GitHub часто нужен не пароль, а **Personal Access Token**:
- GitHub → **Settings** (вашего аккаунта) → **Developer settings** → **Personal access tokens** → **Tokens (classic)** → **Generate new token**.
- Поставьте галочку **repo**.
- Создайте токен и скопируйте его.
- В PowerShell при запросе пароля вставьте этот токен вместо пароля.

После успешного `git push` все файлы проекта окажутся в репозитории на GitHub.

---

## Часть 5. Подключить репозиторий к Vercel

1. Зайдите на **https://vercel.com** и войдите в аккаунт.
2. Нажмите **"Add New..."** → **"Project"**.
3. В списке **Import Git Repository** найдите **GitHub** и нажмите **"Connect"** или **"Configure GitHub App"**.
4. Разрешите Vercel доступ к вашему аккаунту GitHub (и при необходимости выберите репозиторий `bali-realestate`).
5. После подключения в списке репозиториев выберите **bali-realestate** и нажмите **"Import"**.
6. Настройки сборки можно не менять (Vercel сам определит Next.js). Нажмите **"Deploy"**.

Сборка пойдёт на серверах Vercel. Если снова появится ошибка про 250 MB — напишите, будем решать её отдельно (например, через переменные окружения или упрощение зависимостей). После успешного деплоя сайт откроется по ссылке вида `https://bali-realestate-xxx.vercel.app`.

---

## Дальше: переменные окружения и домен

- В карточке проекта на Vercel откройте вкладку **Settings**. Прокрутите страницу вниз — там должен быть блок **Environment Variables**. Добавьте туда `ADMIN_PASSWORD`, `NEXT_PUBLIC_BASE_URL` и при необходимости другие переменные.
- Домен можно подключить в **Settings** → **Domains**.

Если на каком-то шаге что-то не получается — напишите, на каком именно шаге и что видите на экране.
