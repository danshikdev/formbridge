# FormBridge Demo Script

## 1. Короткая речь на 30 секунд

FormBridge - это CRM-слой поверх Google Forms.

Обычно Google Forms просто собирает ответы в таблицу, и потом человеку нужно самому открывать Google Sheets, искать новые заявки, фильтровать, писать клиентам и контролировать статус.

Я сделал систему, которая принимает ответы из Google Forms, сохраняет их в базе, показывает их в удобном CRM-интерфейсе, даёт статусы, фильтры, экспорт, AI-помощника и WhatsApp-уведомления.

За последние 3 дня я довёл проект до рабочего production-результата: сайт поднят на домене, подключён SSL, Google OAuth работает, webhook от Google Forms работает, заявки приходят, WhatsApp уведомления отправляются.

## 2. Что показать первым

Адрес проекта:

```text
https://formbridge.nlrk.online
```

Порядок показа:

1. Открыть сайт.
2. Показать вход через Google.
3. Показать страницу форм.
4. Открыть workspace конкретной формы.
5. Показать, что ответы из Google Form приходят как заявки.
6. Показать карточку заявки: ответы, email, статус.
7. Поменять статус заявки.
8. Показать экспорт JSON/CSV.
9. Показать WhatsApp уведомление на телефоне.
10. Показать AI chat по форме, если API сейчас стабильно отвечает.

Если времени мало, показывать только:

1. Google Form.
2. Отправка нового ответа.
3. FormBridge CRM.
4. WhatsApp уведомление.
5. Ссылка из WhatsApp обратно в FormBridge.

## 3. Как объяснить проблему, которую решает проект

Проблема:

- Google Forms удобен для сбора данных, но неудобен для обработки заявок.
- Ответы попадают в Google Sheets, где трудно вести статусы и коммуникацию.
- Нет нормальной CRM-логики: кто новый, кто в работе, кому уже ответили.
- Нет автоматических уведомлений.
- Если форм много, становится сложно понимать, откуда пришла заявка.

Решение:

- FormBridge превращает Google Forms в CRM.
- Каждая форма становится отдельным workspace.
- Ответы становятся заявками.
- Заявки можно фильтровать, смотреть, экспортировать, менять статус.
- WhatsApp уведомляет о новых заявках и даёт ссылку на нужную форму в FormBridge.
- AI может анализировать ответы внутри выбранной формы.

## 4. Что уже работает

- Production сайт на домене `formbridge.nlrk.online`.
- HTTPS через Let's Encrypt.
- React/Vite frontend.
- Express backend.
- PostgreSQL база данных.
- Sequelize модели.
- JWT авторизация.
- Google Login OAuth.
- Google Forms OAuth foundation.
- Webhook endpoint:

```text
POST /api/forms/webhook/google
```

- Apps Script интеграция:
  - Google Form связывается с Google Sheet.
  - Apps Script ловит `onFormSubmit`.
  - Отправляет payload в FormBridge webhook.
- Проверка webhook secret через header:

```text
x-formbridge-secret
```

- Deduplication по `responseId`.
- CRM заявок:
  - список заявок;
  - фильтры;
  - статусы;
  - детальная карточка;
  - экспорт CSV/JSON.
- WhatsApp уведомления:
  - подключение через QR;
  - отправка при новой заявке;
  - нормализация казахстанских номеров `8...` -> `7...`;
  - ссылка на страницу заявок формы.
- Scenario workspaces:
  - universal;
  - admissions;
  - hr;
  - survey;
  - client_requests;
  - event.
- AI chat по форме.
- Admin dashboard.
- Daily WhatsApp summary MVP.

## 5. Как работает технически

Поток данных:

```text
Google Form
-> linked Google Sheet
-> Apps Script trigger onFormSubmit
-> HTTPS webhook FormBridge
-> Express backend
-> PostgreSQL
-> React CRM interface
-> WhatsApp notification
```

Основные технологии:

- Frontend: React, Vite, React Router, CSS.
- Backend: Node.js, Express.
- Database: PostgreSQL.
- ORM: Sequelize.
- Auth: JWT + Google OAuth.
- Deployment: EC2 Ubuntu server.
- Process manager: PM2.
- Web server: nginx.
- SSL: Let's Encrypt / certbot.
- Google integration: OAuth, Apps Script, Google Forms, Google Sheets.
- Notifications: WhatsApp Web через `whatsapp-web.js`.
- AI: OpenAI API, form-level context.

Термины, которые нужно знать:

- OAuth - безопасный способ входа через Google.
- Webhook - URL, куда внешняя система отправляет событие.
- Trigger - автоматический запуск функции в Apps Script.
- JWT - токен авторизации пользователя.
- ORM - слой для работы с базой через модели.
- PM2 - менеджер Node.js процессов на сервере.
- nginx - reverse proxy, который принимает HTTPS и перенаправляет запросы в backend.
- SSL/TLS - защищённое HTTPS соединение.
- Deduplication - защита от повторного сохранения одной и той же заявки.
- Production - реальная серверная версия проекта.

## 6. Где были сложности

### 1. Google OAuth redirect URI

Ошибка:

```text
redirect_uri=https://formbridge.nlrk.online/api/auth/google/callback
```

Причина:

Google не разрешает OAuth redirect, пока URI не добавлен в Google Cloud Console.

Решение:

Добавили:

```text
https://formbridge.nlrk.online/api/auth/google/callback
https://formbridge.nlrk.online/api/google/oauth/callback
```

### 2. Домен и SSL

Сначала домен был настроен с опечаткой:

```text
formbirdge.nlrk.online
```

Правильный:

```text
formbridge.nlrk.online
```

Решение:

- исправлен nginx `server_name`;
- обновлены backend env URLs;
- выпущен SSL через certbot.

### 3. Frontend API URL

Была проблема:

```text
/api/api/auth/google/start
```

Причина:

Frontend был собран с `VITE_API_URL=/api`, но код уже вызывал `/api/...`.

Решение:

Production frontend собран с:

```text
VITE_API_URL=https://formbridge.nlrk.online
```

### 4. WhatsApp QR и стабильность

Сложность:

WhatsApp Web - не официальный production API. Иногда сессия отваливается, QR нужно сканировать заново, browser frame может умереть.

Что исправлено:

- обработка stale browser session;
- нормализация номеров Казахстана;
- отправка теперь проверяет WhatsApp ID;
- уведомление содержит ссылку на FormBridge.

Но для будущего лучше перейти на официальный WhatsApp Business Cloud API.

### 5. Apps Script и webhook secret

Сложность:

Apps Script должен отправлять правильный `x-formbridge-secret`.

Решение:

Secret хранится на сервере, не в Git. Apps Script должен использовать production secret.

## 7. Что сказать про текущие ограничения

Проект рабочий как MVP, но есть ограничения:

- WhatsApp Web через QR не идеален для production.
- Полная автоматическая установка Google trigger ещё требует доработки.
- AI chat уже есть, но можно улучшить сценарные prompt-ы.
- Нужны более красивые отчёты PDF/Word/Excel.
- Нужна более глубокая аналитика по типам форм.
- Нужно усилить роли пользователей и admin permissions.
- Нужно добавить мониторинг ошибок и alerts.

Важно сказать спокойно:

Сейчас это MVP, который показывает основной поток end-to-end. Главная ценность уже доказана: ответ из Google Form реально превращается в заявку, сохраняется, отображается и отправляет уведомление.

## 8. Что буду делать сегодня

Сегодня задача - показать рабочий результат.

Что я показываю:

- сайт на домене;
- вход через Google;
- заявки из формы;
- webhook;
- WhatsApp уведомления;
- ссылку из WhatsApp обратно в FormBridge;
- экспорт;
- AI/workspace как дополнительную возможность.

После показа я фиксирую feedback:

- что было непонятно;
- где UI нужно упростить;
- какие функции важнее для следующего этапа.

## 9. Что буду делать завтра

Завтра план:

- стабилизировать demo flow;
- сделать чистые тестовые данные;
- улучшить текст WhatsApp уведомлений;
- проверить все формы и сценарии;
- подготовить короткую презентационную структуру;
- записать список bugs после сегодняшнего показа;
- убрать лишние debug logs там, где они мешают.

## 10. Что буду делать до среды

До среды:

- улучшить Guided Setup для подключения Google Form;
- сделать понятнее статус "connected / setup in progress";
- добавить более понятный экран health/integration;
- улучшить AI chat по сценариям формы;
- подготовить demo dataset;
- возможно добавить Word/PDF report export как next feature prototype;
- подготовить короткий technical summary для защиты.

Формулировка:

До среды я хочу не просто добавить новые функции, а сделать текущий рабочий поток более стабильным и понятным для пользователя: подключение формы, получение заявок, уведомления, просмотр и анализ.

## 11. Что можно сделать в будущем

### WhatsApp Business

Перейти с QR-based WhatsApp Web на официальный WhatsApp Business Cloud API.

Плюсы:

- стабильнее;
- можно назвать отправителя FormBridge;
- не нужен QR;
- лучше для SaaS.

Минусы:

- нужны Meta Business настройки;
- нужны approved templates;
- может быть платно.

### Reports

Добавить экспорт:

- Word;
- PDF;
- Excel;
- daily/weekly reports.

### AI

Усилить AI:

- summary по форме;
- выводы по survey;
- рейтинг кандидатов для HR;
- admissions recommendations;
- auto status suggestions.

### Team workflow

Добавить:

- несколько пользователей в одной команде;
- роли;
- комментарии к заявкам;
- история действий;
- назначение ответственного.

### More integrations

Добавить:

- Telegram;
- email;
- Slack;
- Bitrix/amoCRM;
- payment links.

## 12. Как показывать за 5 минут

Сценарий:

1. "Это FormBridge - CRM для Google Forms."
2. Открываю сайт.
3. Вхожу через Google.
4. Открываю форму.
5. Показываю Google Form.
6. Отправляю тестовый ответ.
7. Возвращаюсь в FormBridge.
8. Показываю новую заявку.
9. Показываю WhatsApp уведомление.
10. Открываю ссылку из WhatsApp.
11. Говорю: "Это end-to-end поток: форма -> webhook -> база -> CRM -> уведомление."

## 13. Если спросят "что самое сложное?"

Ответ:

Самое сложное было не просто сделать экран, а связать несколько внешних систем в один стабильный поток:

- Google Forms;
- Google Sheets;
- Apps Script;
- Google OAuth;
- backend webhook;
- PostgreSQL;
- frontend CRM;
- WhatsApp;
- nginx/SSL deployment.

Каждая часть отдельно понятна, но сложности были на стыках: redirect URI, CORS, production env, webhook secret, WhatsApp session, формат номеров, SSL и deployment.

## 14. Если спросят "почему это полезно?"

Ответ:

Потому что многие организации уже используют Google Forms, но дальше обрабатывают ответы вручную. FormBridge не заставляет менять привычный инструмент. Он добавляет поверх него CRM, уведомления, статусы, аналитику и AI.

## 15. Если спросят "почему не просто Google Sheets?"

Ответ:

Google Sheets хранит данные, но не даёт нормальный workflow:

- нет удобных статусов;
- нет карточки заявки;
- нет workspace по форме;
- нет уведомлений;
- нет AI анализа;
- нет роли CRM.

FormBridge превращает ответы в рабочий процесс.

## 16. Мини-речь в конце

За 3 дня я сделал рабочий MVP, где Google Form превращается в CRM-процесс.

Сейчас проект уже работает на домене, принимает реальные заявки, сохраняет их в базе, показывает в интерфейсе и отправляет WhatsApp уведомления.

Дальше я хочу сделать его стабильнее: улучшить подключение форм, перейти на официальный WhatsApp Business API, добавить отчёты Word/PDF и усилить AI под разные сценарии форм.

