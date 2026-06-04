# Диплом: Google Forms толтырылуын бақылау скрипті

**Колледж:** IT және жаңа технологиялар жоғары колледжі
**Мамандық:** 1304000 / 4S06130103 «Бағдарламалық қамтамасыз етуді әзірлеуші»
**Тіл:** қазақша
**Көлем:** 70+ бет

---

## Прогресс

- [x] КІРІСПЕ
- [x] 1. Пәндік облысты сипаттау
- [x] 2. Технологияларды таңдау
- [x] 3. Жүйені жобалау
- [x] 4. Бағдарламалық өнімді әзірлеу
- [ ] 5. Тестілеу
- [ ] 6. Экономикалық бөлім
- [ ] 7. Еңбекті қорғау
- [ ] ҚОРЫТЫНДЫ
- [ ] Пайдаланылған әдебиеттер
- [ ] Қосымшалар

---

## КІРІСПЕ (1 бет)

> _Статус: ✅ жазылды_

---

## 1. ПӘНДІК ОБЛЫСТЫ СИПАТТАУ (~8 бет)

> _Статус: ✅ жазылды_

### 1.1 Google Forms жауаптарын қолмен өңдеу мәселесі
### 1.2 Ұйымдардағы деректерді жинау процесін талдау
### 1.3 Қолданыстағы шешімдерді салыстыру (Zapier, n8n, Google Sheets)
### 1.4 Google Forms API-ның мүмкіндіктері мен шектеулері
### 1.5 Жобаның мақсаты мен міндеттері

---

## 2. ТЕХНОЛОГИЯЛАРДЫ ТАҢДАУ (~7 бет)

> _Статус: ✅ жазылды_

Кез келген бағдарламалық жүйені жобалаудың алдында технологиялық стекті дұрыс таңдау — жобаның табыстылығын, қолдау қабілеттілігін және кеңейту мүмкіндігін тікелей анықтайтын іргелі шешім болып табылады. FormBridge жүйесі үшін технологиялар таңдалғанда мынадай өлшемдер басшылыққа алынды:

- функционалдық талаптарға сәйкестік (Google Forms API-мен интеграция, нақты уақыт жауаптарын бақылау);
- экожүйенің кемелділігі және қауымдастық қолдауы;
- бір уақытта бірнеше сұрауды өңдеу мүмкіндігі (асинхрондық архитектура);
- оқу қисығының қолайлылығы (оқу мекемесінде диплом жұмысы ретінде жасалатындықтан);
- тегін немесе мүмкіндіктері кең ашық бастапқы кодты лицензиялар.

Төменде таңдалған технологиялардың әрқайсысы жеке талданады және баламалармен салыстырылады.

---

### 2.1 Node.js + Express (серверлік бөлік) таңдауды негіздеу

**Node.js** — Google V8 движогіне негізделген серверлік JavaScript орындау ортасы. 2009 жылы Ryan Dahl ұсынған бұл платформа оқиғаларға негізделген (event-driven) және блокталмаған (non-blocking I/O) архитектурасымен ерекшеленеді. Яғни Node.js бір ағынды (single-threaded) болғанымен, бірнеше мыңдаған қатар орындалатын қосылымдарды тиімді өңдей алады, себебі I/O операциялары (желіге сұрау, файлды оқу, деректер қорына жазу) блоктамай, асинхрондық орындалады.

FormBridge жобасында Node.js-тің асинхрондық моделі стратегиялық маңызды болды. Жүйенің негізгі жүктемесі мыналардан тұрады:

1. Google Forms API-ға polling сұраулары (HTTP) — секунд сайын немесе минут сайын орындалатын сыртқы желі сұраулары;
2. PostgreSQL деректер қорына жазу/оқу операциялары;
3. OpenAI API-ға AI-талдау сұраулары;
4. WhatsApp хабарламаларын жіберу сұраулары.

Барлық бұл операциялар негізінен I/O-байланысты (I/O-bound), яғни процессор уақытын аз алады, бірақ желі немесе дискке күту уақыты ұзақ болады. Node.js-тің non-blocking моделі осы сценарий үшін оңтайлы шешім болып табылады.

**Express.js** — Node.js үшін ең кең қолданылатын веб-фреймворк. Ол маршрутизация, middleware тізбегін құру, сұрауды (request) өңдеу және жауапты (response) пішімдеу үшін минималистік, бірақ мощный API ұсынады. FormBridge-де Express мынадай мақсаттарда пайдаланылды:

- REST API маршруттарын ұйымдастыру (`/api/auth`, `/api/forms`, `/api/ai`, т.б.);
- JWT аутентификация middleware-ін (`requireAuth`) тізбекке қосу;
- CORS саясатын реттеу;
- JSON сұрауларды автоматты талдау (body-parser).

**Балама технологиялармен салыстыру.** Серверлік бөлік үшін Python (FastAPI/Django), Java (Spring Boot), Go және .NET Core сияқты альтернативтер қарастырылды. Алайда:

- Python FastAPI жылдамдығы жоғары, бірақ JavaScript-ті клиент және сервер жағында бірдей қолдану мүмкіндігі бізге кодты ортақтастыру жағынан артықшылық берді;
- Java Spring Boot enterprise деңгейіндегі жоба үшін күшті, бірақ дипломдық жоба үшін артық күрделілік болып табылады;
- Go жоғары өнімді, бірақ оқу қисығы биік және экожүйесі аздау.

Нәтижесінде **Node.js 20 LTS + Express 4** тандемі серверлік бөлік үшін оңтайлы шешім ретінде таңдалды.

---

### 2.2 React + Vite (клиенттік бөлік) таңдау

**React** — Meta (бұрынғы Facebook) компаниясы ұсынған, компонент негізіндегі UI-кітапхана. React-тің негізгі идеясы — интерфейсті бөліктерге (компоненттерге) бөлу, әр компонентті жеке логика мен өзінің күйімен (state) жабдықтау. Virtual DOM механизмі арқылы React тек өзгерген DOM элементтерін жаңартады, бұл жоғары өнімді интерфейс жасауға мүмкіндік береді.

FormBridge-де React мынадай жағдайларда маңызды болды:

- **Динамикалық жауаптар тізімі**: жаңа жауаптар polling арқылы жүктелгенде тек өзгерген жолдар ғана DOM-да жаңартылады, бетті толық перерендерлеу орын алмайды;
- **CRM панелі**: өтінішті басқан кезде оң жақ панель деректерімен бірге жаңарады — бұл React state-пен оңай реттеледі;
- **Модалды терезелер, dropdown фильтрлер, AI чат блогы** — компонентке бөлу кодты оңай қолдауға мүмкіндік береді.

**Vite** — Evan You (Vue.js авторы) жасаған заманауи фронтенд билд-инструменті. Vite-тің ескі Webpack-тен негізгі айырмашылығы:

- **Жылдам іске қосу**: Vite ESM (ES Modules) нативті браузер қолдауын пайдаланып, бастапқы жүктеуді бандлсіз орындайды — дамыту сервері секундтар ішінде іске қосылады;
- **Жылдам HMR (Hot Module Replacement)**: файл сақталғанда браузер дереу жаңарады, бетті толық жүктемейді;
- **Оңтайлы production build**: Rollup арқылы минималды bundle мөлшері.

Дамыту барысында Vite-тің жылдам HMR мүмкіндігі өнімділікті айтарлықтай арттырды — UI өзгерістерін дереу браузерде бақылауға болды.

**Балама технологиялармен салыстыру:**

| Технология | Артықшылығы | Кемшілігі |
|---|---|---|
| React + Vite | Кең экожүйе, жылдам HMR, жеткілікті оқу материалдары | Тек UI кітапхана, роутер жеке орнату керек |
| Next.js | SSR/SSG қолдауы | Диплом жобасына артық күрделілік |
| Vue.js | Жеңіл оқу қисығы | Кіші экожүйе |
| Angular | Толық фреймворк | TypeScript мәжбүрлі, ауыр |

FormBridge SPA (Single-Page Application) ретінде жобаланғандықтан және SSR қажет болмағандықтан, **React 18 + Vite 5** таңдемі оңтайлы болды.

---

### 2.3 PostgreSQL + Sequelize ORM таңдау

**PostgreSQL** — 30 жылдан астам дамытылған, ашық бастапқы кодты реляциялық деректер қор жүйесі. ACID транзакцияларын толық қолдауы, JSON деректерімен жұмыс жасау мүмкіндігі, кеңейтілген индекстеу механизмдері және жоғары сенімділігімен ерекшеленеді.

FormBridge-де PostgreSQL-ді таңдаудың негізгі себептері:

1. **Реляциялық деректер моделі**: жүйеде бірнеше кесте арасында күрделі байланыстар бар — `users`, `form_integrations`, `requests`, `google_accounts`, `notification_settings`. Реляциялық модель бұл байланыстарды Foreign Key арқылы дұрыс модельдейді;
2. **JSON қолдауы**: Google Forms жауаптары бастапқыда JSON форматында келеді. PostgreSQL `jsonb` типі арқылы JSON деректерін тиімді сақтауға болады;
3. **Сенімділік**: диплом демонстрациясы кезінде деректер жоғалмауы керек — PostgreSQL WAL (Write-Ahead Logging) механизмі осыны қамтамасыз етеді.

**Sequelize ORM** — Node.js үшін танымал Object-Relational Mapping (ORM) кітапхана. ORM дегеніміз SQL сұрауларды тікелей жазудың орнына JavaScript объектілерімен жұмыс жасауға мүмкіндік беретін абстракция қабаты. Sequelize-дің артықшылықтары:

- Кесте анықтамалары JavaScript класстары ретінде жазылады (`Model.define`);
- Байланыстар (`hasMany`, `belongsTo`) бір жерде анықталады;
- Деректер қорын жасау және жаңарту `sync()` немесе migrations арқылы автоматтандырылады;
- SQL injection шабуылдарынан автоматты қорғаныс.

**[СКРИНШОТ: FormBridge деректер қорының кесте диаграммасы (ER-диаграмма) — pgAdmin немесе DBngin арқылы]**

**Балама технологиялармен салыстыру:**

- **MySQL** — PostgreSQL-ге ұқсас, бірақ JSON қолдауы әлсізірек және кейбір стандарт SQL конструкциялары ерекше жүзеге асырылған;
- **MongoDB** — NoSQL шешімі. JSON жауаптарын сақтау үшін ыңғайлы болуы мүмкін, бірақ пайдаланушылар, интеграциялар және жауаптар арасындағы қатаң реляциялық байланыстарды сақтау күрделенеді;
- **SQLite** — тек жергілікті жобалар үшін, өнімдік ортада шектелген.

Нәтижесінде **PostgreSQL 15 + Sequelize 6** таңдемі жоба талаптарын толық қанағаттандыратын шешім ретінде таңдалды.

---

### 2.4 Google Forms API + OAuth 2.0 интеграциясы

**Google Forms API** — Google-дың Forms сервисімен бағдарламалық деңгейде жұмыс жасауға мүмкіндік беретін REST API. FormBridge жобасының іргесі осы API-ға негізделген — жүйенің басты мақсаты Google Forms жауаптарын автоматты жинау және өңдеу болып табылады.

Google Forms API мынадай мүмкіндіктер ұсынады:

- **Форма метадеректерін алу** (`GET /forms/{formId}`) — форма атауы, сипаттамасы, сұрақтар тізімі;
- **Жауаптарды жинау** (`GET /forms/{formId}/responses`) — барлық жауаптарды немесе белгілі бір уақыттан кейінгі жауаптарды алу (`filter` параметрі);
- **Watch API** — Google Form-дағы жаңа жауаптар туралы push-хабарламалар алу мүмкіндігі (бірақ бұл мүмкіндік Google Workspace лицензиясын талап ететіндіктен, FormBridge-де polling механизмі таңдалды).

**OAuth 2.0 аутентификациясы.** Google Forms API-ға қол жеткізу үшін міндетті түрде OAuth 2.0 хаттамасы арқылы пайдаланушы атынан рұқсат алу қажет. OAuth 2.0 — үшінші тарап қосымшаларға пайдаланушы паролін бермей, белгілі бір ресурстарға шектелген рұқсат беруді қамтамасыз ететін индустриялық стандарт.

FormBridge-де OAuth 2.0 ағыны мынадай кезеңдерден тұрады:

1. Пайдаланушы «Google-мен байланыстыру» батырмасын басады;
2. Жүйе Google Authorization Server-ге сұрау жібереді (`authorization_code` grant type);
3. Пайдаланушы Google аккаунтына кіреді және рұқсатты растайды;
4. Google `authorization_code` қайтарады, FormBridge оны `access_token` және `refresh_token`-ге айырбастайды;
5. `access_token` (қысқа мерзімді) Google Forms API сұрауларында пайдаланылады;
6. `refresh_token` (ұзақ мерзімді) мерзімі өткен кезде жаңа `access_token` алу үшін сақталады.

Рұқсат беріледі тек мынадай OAuth scope-тар бойынша:
- `https://www.googleapis.com/auth/forms.responses.readonly` — жауаптарды тек оқу;
- `https://www.googleapis.com/auth/forms.body.readonly` — форма мәтінін оқу.

Бұл minimal privilege (ең аз артықшылық) принципіне сәйкес — жүйе пайдаланушы аккаунтына тек қажетті рұқсаттарды сұрайды.

**[СКРИНШОТ: Google Cloud Console — OAuth Consent Screen немесе Credentials беті]**

---

### 2.5 Қосымша сервистер: OpenAI API, WhatsApp Web

#### OpenAI API

FormBridge-де AI-талдау мүмкіндіктері **OpenAI API** арқылы іске асырылды. Жүйеде екі деңгейдегі AI функционалдығы жобаланды:

**1. Жеке өтінішті талдау** (`POST /api/ai/analyze-request`) — менеджер нақты бір жауапты таңдап, AI-дан талдау сұрайды. AI жауаптың мазмұнын оқып, қысқаша мазмұнын, ұсынылатын статусты және ескертпелерді JSON форматында қайтарады.

**2. Форма деңгейіндегі AI чат** (`POST /api/ai/form-chat`) — менеджер форманың барлық жауаптары бойынша еркін сұрақ қоя алады («Бүгін неше өтініш қабылданды?», «Ең көп кездесетін мәселе қандай?», т.б.). AI соңғы 50 жауапты контекст ретінде қабылдап, мәтіндік жауап береді.

**Модель таңдауы.** Жүйеде `gpt-4o-mini` моделі қолданылды (конфигурацияда `OPENAI_MODEL` env айнымалысы арқылы өзгертілетін). Бұл модель:

- Жеткілікті мәтін түсіну қабілетіне ие;
- API шақыру құны салыстырмалы арзан;
- Жауап беру жылдамдығы жоғары.

**Жүйелік промпт (system prompt)** сценарийге байланысты динамикалық жасалады. Мысалы, «HR» сценарийінде AI «кадрлар бөлімінің тәжірибелі маманы» рөлінде, «Қабылдау комиссиясы» сценарийінде — «жоғары оқу орны қабылдау комиссиясының хатшысы» рөлінде жұмыс жасайды.

#### WhatsApp хабарлама жүйесі

WhatsApp — Қазақстанда және ТМД елдерінде ең кең тараған мобильді мессенджер болып табылады. FormBridge-де WhatsApp интеграциясы мынадай жағдайларда пайдаланушыға хабарлама жіберуге мүмкіндік береді:

- Формаға жаңа жауап түскен кезде (нақты уақыт хабарламасы);
- Тәулік сайын жинақталған есеп (daily digest) — күн бойы қанша жауап келгені, статустардың үлесі.

Техникалық тұрғыдан интеграция **WhatsApp Cloud API** (Meta Business API) немесе **whatsapp-web.js** кітапханасы арқылы іске асырылады. Кітапхана Puppeteer (headless браузер) арқылы WhatsApp Web сессиясын имитациялайды және QR-код арқылы аутентификациядан өтеді.

**Ескерту.** WhatsApp Cloud API өнімдік деңгейде ресми және сенімді шешім болып табылады, алайда Meta Business аккаунты мен телефон нөмірін верификациялауды талап етеді. Диплом демонстрациясы үшін whatsapp-web.js кітапханасы жеткілікті шешім ретінде пайдаланылды.

#### Технологиялық стек жиынтық кестесі

| Бөлім | Технология | Нұсқа | Рөлі |
|---|---|---|---|
| Серверлік орта | Node.js | 20 LTS | JavaScript runtime |
| Серверлік фреймворк | Express.js | 4.x | REST API |
| Клиенттік кітапхана | React | 18.x | UI компоненттері |
| Билд-инструмент | Vite | 5.x | Фронтенд жинау |
| Деректер қоры | PostgreSQL | 15.x | Реляциялық сақтау |
| ORM | Sequelize | 6.x | Деректер қорымен жұмыс |
| Аутентификация | JWT + OAuth 2.0 | — | Қауіпсіздік |
| Сыртқы API | Google Forms API | v1 | Жауаптар жинау |
| AI моделі | OpenAI API | GPT-4o-mini | Жауаптарды талдау |
| Хабарлама | WhatsApp Web | — | Мобильді хабарламалар |

---

## 3. ЖҮЙЕНІ ЖОБАЛАУ (~13 бет)

> _Статус: ✅ жазылды_

Жүйені жобалау кезеңі бағдарламалық өнімнің ішкі архитектурасын, деректер моделін, компоненттер арасындағы байланыстарды және негізгі алгоритмдерді анықтайды. Бұл бөлімде FormBridge жүйесінің жалпы архитектурасы, деректер қорының құрылымы, Google Forms API арқылы бақылау механизмі және қауіпсіздік шешімдері егжей-тегжейлі сипатталады.

---

### 3.1 Жүйенің жалпы архитектурасы (клиент-сервер моделі)

FormBridge үш деңгейлі (three-tier) клиент-сервер архитектурасына негізделген:

**1-деңгей — Клиент (Presentation Tier)**
Пайдаланушы браузерде жұмыс жасайтын React SPA қосымшасы. Клиент сервермен тек REST API арқылы JSON форматында байланысады. Клиенттік бөлік мынадай беттерден тұрады:
- Кіру / тіркелу беті (`/login`, `/register`);
- Менің формаларым (`/forms`) — пайдаланушының қосқан формалары;
- Жұмыс кеңістігі (`/forms/:formId/requests`) — CRM панелі, жауаптар кестесі;
- Аналитика (`/forms/:formId/analytics`) — диаграммалар;
- Параметрлер (`/forms/:formId/settings`) — интеграция баптаулары.

**2-деңгей — Сервер (Application Tier)**
Node.js + Express серверлік қосымшасы. Барлық бизнес-логика осы деңгейде орналасады:
- REST API контроллерлері (auth, forms, requests, AI, integrations);
- JWT аутентификация middleware;
- Google Forms API-ға polling жоспарлаушысы (node-cron);
- OpenAI, WhatsApp сервистерімен интеграция.

**3-деңгей — Деректер (Data Tier)**
PostgreSQL деректер қоры. Барлық тұрақты деректер (пайдаланушылар, форма интеграциялары, жауаптар, хабарлама баптаулары) осы деңгейде сақталады. Сервер Sequelize ORM арқылы деректер қорымен байланысады.

**Жүйенің жалпы деректер ағыны:**

```
[Пайдаланушы браузері]
        ↕  HTTPS / REST API (JSON)
[Express сервері — порт 5000]
        ↕  Sequelize ORM
[PostgreSQL деректер қоры]
        ↕  HTTP (Google APIs Client)
[Google Forms API]
        ↕  HTTP (OpenAI SDK)
[OpenAI API]
        ↕  HTTP / WebSocket
[WhatsApp Web]
```

**[СКРИНШОТ: FormBridge жүйесінің архитектуралық схемасы немесе бір негізгі беттің скриншоты — мысалы, CRM жұмыс кеңістігі]**

---

### 3.2 Деректер қорының құрылымы

FormBridge деректер қоры 6 негізгі кестеден тұрады. Төменде әр кестенің мақсаты, өрістері және кестелер арасындағы байланыстар сипатталады.

#### Кесте: `users`

Жүйеге тіркелген пайдаланушылардың деректерін сақтайды.

| Өріс | Тип | Сипаттама |
|---|---|---|
| id | UUID / SERIAL | Негізгі кілт |
| email | VARCHAR(255) | Уникалды электрондық пошта |
| password_hash | VARCHAR | BCrypt-пен хэшталған пароль |
| name | VARCHAR(255) | Пайдаланушы аты |
| created_at | TIMESTAMP | Тіркелу уақыты |

#### Кесте: `google_accounts`

Пайдаланушының байланыстырған Google аккаунты деректерін сақтайды (OAuth 2.0 токендері).

| Өріс | Тип | Сипаттама |
|---|---|---|
| id | SERIAL | Негізгі кілт |
| user_id | INTEGER | `users.id`-ге сілтеме (FK) |
| google_email | VARCHAR | Google аккаунт поштасы |
| access_token | TEXT | Уақытша рұқсат токені |
| refresh_token | TEXT | Жаңарту токені |
| token_expiry | TIMESTAMP | `access_token` мерзімі |

#### Кесте: `form_integrations`

Пайдаланушының FormBridge-ге қосқан Google Forms формаларын сақтайды.

| Өріс | Тип | Сипаттама |
|---|---|---|
| id | SERIAL | Негізгі кілт |
| user_id | INTEGER | Иесі (FK → users) |
| form_id | VARCHAR | Google Forms форма ID |
| form_title | VARCHAR | Форма атауы |
| scenario | VARCHAR | Сценарий: universal/admissions/hr/survey/client_requests/event |
| scenario_configured_at | TIMESTAMP | Сценарий орнатылған уақыт (null = орнатылмаған) |
| polling_interval | INTEGER | Polling жиілігі (минут) |
| last_synced_at | TIMESTAMP | Соңғы синхрондау уақыты |
| is_active | BOOLEAN | Polling қосулы/өшірулі |
| created_at | TIMESTAMP | Қосылған уақыт |

#### Кесте: `requests`

Google Forms жауаптарын CRM өтінішіне айналдырып сақтайды.

| Өріс | Тип | Сипаттама |
|---|---|---|
| id | SERIAL | Негізгі кілт |
| form_integration_id | INTEGER | FK → form_integrations |
| response_id | VARCHAR | Google Forms жауап ID (уникалды) |
| respondent_email | VARCHAR | Жауап берушінің поштасы |
| answers | JSONB | Барлық жауаптар JSON форматында |
| status | VARCHAR | Жауап статусы (сценарийге байланысты) |
| notes | TEXT | Менеджер ескертпесі |
| ai_summary | TEXT | AI талдау нәтижесі |
| submitted_at | TIMESTAMP | Жауап берілген уақыт |
| created_at | TIMESTAMP | Жүйеге қосылған уақыт |

#### Кесте: `notification_settings`

Пайдаланушының WhatsApp хабарлама баптауларын сақтайды.

| Өріс | Тип | Сипаттама |
|---|---|---|
| id | SERIAL | Негізгі кілт |
| user_id | INTEGER | FK → users |
| form_integration_id | INTEGER | FK → form_integrations |
| whatsapp_phone | VARCHAR | WhatsApp нөмірі |
| notify_on_new | BOOLEAN | Жаңа жауапта хабарла |
| daily_digest | BOOLEAN | Тәулік сайын есеп |
| digest_time | TIME | Есеп жіберу уақыты |

#### Кесте: `form_feedback`

Пайдаланушылардың жүйе туралы пікірлерін сақтайды.

| Өріс | Тип | Сипаттама |
|---|---|---|
| id | SERIAL | Негізгі кілт |
| user_id | INTEGER | FK → users |
| form_integration_id | INTEGER | FK → form_integrations |
| rating | INTEGER | Баға (1–5) |
| comment | TEXT | Пікір мәтіні |
| created_at | TIMESTAMP | Жазылған уақыт |

**Кестелер арасындағы байланыстар:**
- `users` → `google_accounts`: бір пайдаланушыда бір Google аккаунт (1:1);
- `users` → `form_integrations`: бір пайдаланушының бірнеше формасы болуы мүмкін (1:N);
- `form_integrations` → `requests`: бір формада бірнеше жауап (1:N);
- `form_integrations` → `notification_settings`: форма бойынша хабарлама баптауы (1:1);
- `form_integrations` → `form_feedback`: форма бойынша пікірлер (1:N).

**[СКРИНШОТ: pgAdmin немесе DBngin арқылы деректер қорының ER-диаграммасы]**

---

### 3.3 Google Forms API арқылы бақылау механизмі

Google Forms API-да жаңа жауаптар туралы «push» хабарлама алу мүмкіндігі (Watch API) тек Google Workspace корпоративтік аккаунттарына қолжетімді. FormBridge тегін Google аккаунттарымен жұмыс жасауға арналғандықтан, «polling» (сұрау жасау) механизмі таңдалды.

**Polling** дегеніміз — жүйенің белгілі уақыт аралығында Google Forms API-ға сұрау жасап, жаңа жауаптар бар-жоғын өзі тексеруі. Бұл WebSocket немесе webhook-тен айырмашылығы: push (серверден клиентке деректер жіберу) емес, pull (клиент сервердан деректер сұрайды) парадигмасы.

**Polling сұрауының логикасы:**

1. Scheduler белгіленген уақытта (мысалы, 5 минут сайын) белсенді (`is_active = true`) форма интеграциялары тізімін алады;
2. Әр форма үшін соңғы синхрондау уақыты (`last_synced_at`) белгіленеді;
3. Google Forms API-ға `filter=timestamp > last_synced_at` параметрімен сұрау жасалады;
4. Қайтарылған жауаптар тізімінен `response_id` бойынша бұрын сақталмаған жаңалар анықталады;
5. Жаңа жауаптар `requests` кестесіне сақталады, статус `new` мәніне орнатылады;
6. Хабарлама баптауы қосулы болса, WhatsApp хабарламасы жіберіледі;
7. `last_synced_at` ағымдағы уақытқа жаңартылады.

**Қайталанудан қорғаныс.** Google Forms жауабының `responseId` өрісі бірегей болып табылады. Жүйе жаңа жауапты сақтамас бұрын `response_id` бойынша деректер қорында тексереді — егер бұрын сақталған болса, жазба жасалмайды. Бұл polling процесінде желі үзілісі немесе сервер қайта іске қосылған жағдайда жауаптардың қайталанбауын қамтамасыз етеді.

---

### 3.4 Polling алгоритмі: жоспарлаушы + синхрондау қызметі

FormBridge серверінде **node-cron** кітапханасы негізінде периодты жоспарлаушы (scheduler) іске асырылды. node-cron — UNIX cron синтаксисін қолдайтын Node.js кітапхана, сервер іске қосылғанда автоматты жұмыс жасайды.

**Polling жоспарлаушысының іске қосылу схемасы:**

```
Сервер іске қосылады (app.js)
    └─> Scheduler тіркеледі (cron.schedule)
            └─> Әр N минут сайын орындалады:
                    └─> getActiveIntegrations()
                            └─> forEach(integration):
                                    └─> syncFormResponses(integration)
                                            ├─> Google Forms API GET /responses?filter=...
                                            ├─> filterNewResponses()
                                            ├─> saveToDatabase()
                                            ├─> sendWhatsAppIfEnabled()
                                            └─> updateLastSyncedAt()
```

**Синхрондау қызметінің қателерді өңдеуі.** Polling барысында мынадай жағдайларда қате пайда болуы мүмкін:
- Google API лимиті асып кеткен (rate limit) — жүйе 429 қате кодын алып, келесі циклде қайталайды;
- `access_token` мерзімі өткен — жүйе автоматты `refresh_token` арқылы жаңа токен алады;
- Интернет байланысы үзілді — қате тіркеледі, `last_synced_at` жаңартылмайды, келесі циклде қайталанады.

Бұл тәсіл «at-least-once delivery» моделін іске асырады — желі мәселесі кезінде жауап жоғалмайды, өйткені `last_synced_at` тек сәтті синхрондаудан кейін ғана жаңартылады.

---

### 3.5 OAuth 2.0 және JWT аутентификация схемасы

FormBridge-де екі деңгейлі аутентификация жүйесі жобаланды:

**1-деңгей — FormBridge аутентификациясы (JWT)**

Пайдаланушы FormBridge жүйесіне өз email/паролімен кіреді. Пароль BCrypt алгоритмімен хэшталып `users` кестесіне сақталады. Аутентификация сәтті болғанда сервер **JWT (JSON Web Token)** жасайды және клиентке жібереді.

JWT-тің құрылымы үш бөліктен тұрады:
- **Header** — алгоритм типі (HS256);
- **Payload** — `userId`, `email`, `iat` (жасалған уақыт), `exp` (мерзімі);
- **Signature** — `JWT_SECRET` кілтімен хэшталған қол.

Клиент JWT-ті `localStorage`-та `fb_token` кілтімен сақтайды. Кейінгі барлық API сұрауларында `Authorization: Bearer <token>` тақырыбы автоматты қосылады. Сервердегі `requireAuth` middleware токенді тексеріп, `req.userId`-ді орнатады.

**2-деңгей — Google OAuth 2.0 (форма байланыстыру)**

FormBridge аккаунтына кірген пайдаланушы Google формасын қосқысы келгенде Google OAuth 2.0 ағыны басталады. Бұл деңгей FormBridge логинінен тәуелсіз — пайдаланушы FormBridge аккаунтына кіріп, одан кейін бөлек Google аккаунтын байланыстырады.

```
[Пайдаланушы] → /api/google/auth → [Google Authorization Server]
                                              ↓
                              Пайдаланушы рұқсат береді
                                              ↓
                    /api/google/callback?code=XXX ← [Google]
                              ↓
              access_token + refresh_token алынады
                              ↓
              google_accounts кестесіне сақталады
```

**Токен жаңарту (Token Refresh).** Google-дың `access_token` мерзімі 1 сағат. Мерзімі өткен кезде жүйе автоматты `refresh_token` арқылы жаңа `access_token` сұрайды — бұл пайдаланушыдан қайта рұқсат сұрамай жасалады. `refresh_token` деректер қорында шифрланбаған күйде сақталатындықтан, оны өндірістік ортада шифрлап сақтау ұсынылады.

---

### 3.6 Сценарийге бағытталған жауаптарды өңдеу моделі

FormBridge-тің негізгі инновациясы — бір Google Forms + бір жұмыс кеңістігі моделі ғана емес, сол жұмыс кеңістігіне **сценарий** тағайындау мүмкіндігі. Сценарий — пайдаланушының форма мақсатын жүйеге жариялауы. Бұл арқылы жүйе форма контексін түсініп, статус ағымдарын, AI промпттарын және ұсынылатын сұрақтарды автоматты бейімдейді.

**Жобаланған сценарийлер:**

| Сценарий ID | Атауы | Типтік мысал |
|---|---|---|
| `universal` | Жалпы форма | Кез келген мақсаттағы форма |
| `admissions` | Қабылдау комиссиясы | Оқуға түсу өтінімдері |
| `hr` | HR / Жалдау | Жұмысқа орналасу өтінімдері |
| `survey` | Сауалнама | Пікір жинау, зерттеу |
| `client_requests` | Клиент өтінімдері | Кері байланыс, шағымдар |
| `event` | Іс-шара | Тіркелу, қатысу тізімі |

**Статус ағымы (Status Flow).** Әр сценарийдің өзіне тән статустар жиыны бар. Мысалы:

- `admissions`: `new → contacted → documents_received → approved / rejected`;
- `hr`: `new → reviewed → interview_scheduled → hired / rejected`;
- `universal`: `new → in_progress → done / rejected`.

Сценарий `universal`-дан басқасына ауысқанда форманың барлық жауаптарының статус тізімі де жаңа сценарийдің статус ағымына сәйкес жаңартылады.

**AI промпт бейімдеуі.** Сценарий таңдалғанда AI чат блогының жүйелік промпты автоматты өзгереді. Мысалы, `admissions` сценарийінде AI «оқу орнының қабылдау бөлімінің маманы» рөлінде жауап береді, `hr`-де — «кадрлар бөлімінің маманы».

**[СКРИНШОТ: FormBridge-тің сценарий таңдау интерфейсі немесе статус фильтрі бар CRM кестесі]**

---

### 3.7 WhatsApp хабарлама жүйесін жобалау

WhatsApp хабарлама жүйесі екі режимде жұмыс жасайды:

**1-режим: Нақты уақыт хабарламасы (real-time notification)**

Жаңа жауап Google Forms-тан polling арқылы алынып, деректер қорына сақталған сәтте, пайдаланушының `notify_on_new` баптауы қосулы болса, хабарлама бірден жіберіледі. Хабарлама мазмұны:

```
📋 Жаңа өтініш түсті!
Форма: [форма атауы]
Уақыт: [күн уақыт]
Жауаптар: [негізгі өрістер]
FormBridge-те қарау: [сілтеме]
```

**2-режим: Тәулік сайынғы есеп (daily digest)**

`daily_digest` қосулы болса, `digest_time`-да (мысалы, 09:00) тәуліктік жиынтық хабарлама жіберіледі:

```
📊 Тәулік есебі — [күн]
Форма: [форма атауы]
Жаңа өтініштер: [саны]
Өңделді: [саны]
Бекітілді: [саны]
Қабылданбады: [саны]
```

**Техникалық іске асыру.** WhatsApp сессиясы сервер іске қосылғанда жасалады. Алғаш рет QR-код сканерлеу арқылы аутентификациядан өтеді, сессия файлда кэшталады, кейінгі іске қосуларда QR-код сканерлемей автоматты қосылады.

**Шектеулер.** whatsapp-web.js кітапханасы WhatsApp-тың ресми емес интерфейсін пайдаланады, сондықтан WhatsApp аккаунтын бұғаттау тәуекелі бар. Өндірістік пайдалану үшін Meta Business API ұсынылады.

---

### 3.8 Деректер қауіпсіздігі және қорғау

FormBridge жобасында мынадай қауіпсіздік шаралары жобаланды:

**1. Парольдерді қорғау.** Барлық пайдаланушы парольдері BCrypt алгоритмімен хэшталады. BCrypt-тің cost factor параметрі (rounds=10) brute force шабуылдарын баяулатады. Деректер қорында тек хэш сақталады, бастапқы пароль ешқашан сақталмайды.

**2. JWT қауіпсіздігі.** JWT-ті жасауда пайдаланылатын `JWT_SECRET` — ұзын, кездейсоқ жасалған жол. Ол тек серверде `.env` файлында сақталады, ешқашан клиентке жіберілмейді. Токен мерзімі шектелген (`expiresIn: '7d'`).

**3. SQL Injection қорғаныс.** Sequelize ORM барлық деректер қорына сұрауларда параметрлерді автоматты экрандайды (parameterized queries), SQL Injection шабуылын болдырмайды.

**4. CORS саясаты.** Express сервері тек белгіленген домендерден (`CORS_ORIGIN` env айнымалысы) сұрауларды қабылдайды.

**5. Environment Variables.** Барлық сезімтал деректер (API кілттер, пароль, секреттер) `.env` файлында сақталады және Git репозиторийіне жүктелмейді (`.gitignore`-да тіркелген).

**6. HTTPS.** Өндірістік ортада барлық трафик HTTPS арқылы шифрланады. Дамыту ортасында HTTP қолданылады, бірақ мұнда тек жергілікті машинада жұмыс жасалатындықтан тәуекел минималды.

**7. Minimal OAuth Scope.** Google OAuth рұқсаты тек оқу (readonly) режимінде — форма мазмұнын немесе жауаптарды өзгерту рұқсаты сұралмайды.

---

## 4. БАҒДАРЛАМАЛЫҚ ӨНІМДІ ӘЗІРЛЕУ (~20 бет)

> _Статус: ✅ жазылды_

Бұл бөлімде FormBridge жүйесінің серверлік және клиенттік бөліктерінің нақты іске асырылу барысы, кодтық шешімдер, модульдік құрылым және интерфейс дизайны егжей-тегжейлі сипатталады. Жобаның барлық бастапқы коды Node.js ESM (ECMAScript Modules) форматында жазылған — бұл `import`/`export` синтаксисін пайдалануға және модульдерді анық бөліп жазуға мүмкіндік береді.

---

### 4.1 Серверлік бөлік (Backend)

#### 4.1.1 Backend модульдерінің құрылымы

FormBridge серверлік бөлігі `backend/src/` каталогында орналасқан және мынадай ішкі каталогтарға бөлінген:

```
backend/src/
├── app.js               — Express қосымшасы, маршруттар тіркеу
├── server.js            — HTTP сервер іске қосу, scheduler бастау
├── config/
│   ├── database.js      — Sequelize + PostgreSQL байланысы
│   ├── env.js           — Барлық env айнымалылары орталықтандырылған
│   └── formScenarios.js — Сценарийлер конфигурациясы
├── middleware/
│   └── auth.js          — requireAuth middleware (JWT тексеру)
├── models/
│   ├── user.js          — users кестесі
│   ├── googleAccount.js — google_accounts кестесі
│   ├── formIntegration.js — form_integrations кестесі
│   ├── request.js       — requests кестесі
│   ├── notificationSettings.js
│   ├── formFeedback.js
│   └── associations.js  — Кестелер арасындағы байланыстар
├── routes/
│   ├── authRoutes.js
│   ├── googleOAuthRoutes.js
│   ├── googleFormsRoutes.js
│   ├── whatsappRoutes.js
│   ├── aiRoutes.js
│   └── integrationsRoutes.js
├── controllers/
│   ├── authController.js
│   ├── googleOAuthController.js
│   ├── googleFormsController.js
│   └── ...
└── services/
    ├── googleService.js
    ├── googleFormsSyncService.js
    ├── googleFormsPollingScheduler.js
    ├── openaiService.js
    ├── whatsappService.js
    └── whatsappNotificationService.js
```

Бұл MVC-ға жақын архитектура: `routes` маршрутты анықтайды, `controllers` HTTP логикасын өңдейді, `services` бизнес-логиканы орындайды, `models` деректер қорымен жұмыс жасайды.

**Express қосымшасын тіркеу.** `app.js` файлында барлық маршруттар бір жерде тіркелген:

```javascript
app.use("/api/auth", authRoutes);
app.use("/api/forms", googleFormsRoutes);
app.use("/api/google", googleOAuthRoutes);
app.use("/api/integrations", integrationsRoutes);
app.use("/api/notifications/whatsapp", whatsappRoutes);
app.use("/api/ai", aiRoutes);
```

Сонымен қатар `app.js`-та CORS саясаты бапталған — тек `CORS_ORIGIN` env айнымалысында тіркелген домендерден (мысалы, `http://localhost:5173`) сұрауларды қабылдайды. Бұл `origin` callback функциясы арқылы динамикалық тексерумен іске асырылған.

---

#### 4.1.2 Аутентификацияны іске асыру

FormBridge-де email/пароль негізіндегі JWT аутентификациясы іске асырылды. Тіркелу (`register`) және кіру (`login`) функциялары `authController.js` файлында орналасқан.

**Тіркелу логикасы:**

```javascript
export async function register(req, res) {
  const { fullName, email, password } = req.body;
  const exists = await User.findOne({ where: { email } });
  if (exists) return res.status(409).json({ error: "Email already exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ fullName, email, passwordHash });
  const token = signAccessToken(user);
  return res.status(201).json({ token, user: sanitizeUser(user) });
}
```

Тіркелу кезінде `bcrypt.hash(password, 10)` арқылы пароль хэшталады. `rounds=10` — brute-force шабуылдарына қарсы баяулату коэффициенті. `sanitizeUser` функциясы `passwordHash` өрісін жауаптан алып тастайды — клиентке тек `id`, `email`, `fullName`, `role` жіберіледі.

**Кіру логикасы:**

```javascript
export async function login(req, res) {
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signAccessToken(user);
  return res.json({ token, user: sanitizeUser(user) });
}
```

`bcrypt.compare` — кіріс паролін сақталған хэшпен салыстырады. Аутентификация сәтті болса, `signAccessToken(user)` арқылы JWT жасалады. JWT `payload`-та `sub: user.id`, `email`, `role` және `exp` (мерзімі) өрістері бар.

**requireAuth middleware:**

```javascript
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.slice(7);
  const payload = jwt.verify(token, env.jwtSecret);
  const user = await User.findByPk(payload.sub);
  if (!user) return res.status(401).json({ error: "User not found" });
  req.user = user;
  next();
}
```

`requireAuth` middleware барлық қорғалған маршруттардың алдына қойылады. Middleware `Authorization: Bearer <token>` тақырыбын тексеріп, токенді верификациялайды, деректер қорынан пайдаланушыны жүктейді және `req.user`-ге орнатады. Нәтижесінде controller функцияларында `req.user.id` арқылы ағымдағы пайдаланушыға қол жеткізуге болады.

---

#### 4.1.3 Google OAuth 2.0 интеграциясын іске асыру

Google Forms API-ға қол жеткізу үшін OAuth 2.0 хаттамасы арқылы пайдаланушы Google аккаунтын байланыстыру қажет. Бұл процесс `googleOAuthController.js` файлында іске асырылды.

**OAuth ағынының іске асырылуы:**

`/api/google/auth` эндпойнтына сұрау жасалғанда `buildGoogleAuthUrl(encodeState(req.user.id), ...)` функциясы шақырылады. Бұл функция Google Authorization Server-ге бағытталатын URL жасайды. URL-де `state` параметрі бар — бұл CSRF шабуылынан қорғаныс мақсатында JWT форматында пайдаланушы ID-сі кодталған жол:

```javascript
function encodeState(userId) {
  return jwt.sign(
    { sub: userId, purpose: "google_oauth" },
    env.jwtSecret,
    { expiresIn: "10m" }
  );
}
```

Google callback эндпойнтына (`/api/google/callback`) `code` және `state` параметрлері қайтарылады. `decodeState(state)` арқылы `state` верификацияланады, `exchangeCodeForTokens(code)` арқылы `access_token` және `refresh_token` алынады, `fetchGoogleProfile` арқылы Google аккаунт мәліметтері жүктеледі.

Алынған деректер `google_accounts` кестесіне сақталады:

```javascript
if (existing) {
  await existing.update(payload);
} else {
  await GoogleAccount.create(payload);
}
```

Бұл логика бір пайдаланушы бірнеше рет байланыстырған жағдайда жаңа жазба жасамай, бар жазбаны жаңартады. `refresh_token` мерзімсіз болғандықтан, тек бірінші байланыстыруда келеді — сондықтан `tokens.refresh_token || existing?.refreshToken` конструкциясы пайдаланылды.

**[СКРИНШОТ: Google аккаунтын байланыстыру беті — «Connect Google Account» батырмасы]**

---

#### 4.1.4 Google Forms API арқылы жауаптарды жинау

Google Forms жауаптарын жинау `googleFormsSyncService.js` файлындағы `syncFormIntegration` функциясында іске асырылды. Функция мынадай кезеңдерді орындайды:

**1. Google аккаунтын тексеру және синхрондау статусын орнату:**

```javascript
integration.syncStatus = "syncing";
integration.lastSyncError = null;
await integration.save();
```

Синхрондау кезінде `syncStatus = "syncing"` мәні орнатылады. Бұл polling scheduler параллелді синхрондауды болдырмайды — басқа tick `syncStatus === "syncing"` болған интеграцияны өткізіп жібереді.

**2. Форма метадеректерін жүктеу:**

```javascript
const googleForm = await getGoogleForm(account, integration.formId);
const formTitle = googleForm.info?.title || integration.formTitle;
const questionMap = questionMapFromForm(googleForm);
```

`getGoogleForm` функциясы Google Forms API-ға `GET /forms/{formId}` сұрау жасайды. `questionMapFromForm` функциясы форманың сұрақтарын `questionId → сұрақ мәтіні` картасына айналдырады. Бұл жауаптарды адамға түсінікті форматта сақтау үшін қажет.

**3. Жауаптарды жинау және нормализациялау:**

```javascript
const responses = await listGoogleFormResponses(account, integration.formId);

for (const response of responses) {
  const payload = normalizeResponse(response, integration, questionMap);
  const [record, wasCreated] = await Request.findOrCreate({
    where: { responseId: payload.responseId },
    defaults: payload
  });
  if (wasCreated) {
    created += 1;
    createdRecords.push(record);
  }
}
```

`normalizeResponse` функциясы Google Forms жауабының форматын FormBridge ішкі форматына түрлендіреді. Жауаптар `[{ question: "...", answer: "..." }]` массив форматына келтіріледі. `responseId` өрісі `{formId}:{googleResponseId}` форматында жасалады — бұл бірегейлікті қамтамасыз етеді.

`Request.findOrCreate` — Sequelize-дің атомарлы операциясы: жазба бар болса табады, жоқ болса жасайды. Бұл polling процесінде жауаптардың қайталанып сақталуынан қорғайды.

---

#### 4.1.5 Polling жоспарлаушысын (Scheduler) іске асыру

`googleFormsPollingScheduler.js` файлында `setInterval` негізінде периодты жоспарлаушы іске асырылды:

```javascript
const DEFAULT_POLL_INTERVAL_MS = 30_000; // 30 секунд

export function startGoogleFormsPollingScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  const intervalMs = Number(process.env.GOOGLE_FORMS_POLL_INTERVAL_MS
    || DEFAULT_POLL_INTERVAL_MS);

  setInterval(() => {
    runPollingTick().catch(console.error);
  }, intervalMs);
}
```

`schedulerStarted` жалаушасы сервер қайта жүктелген жағдайда жоспарлаушының екі рет іске қосылуын болдырмайды.

**Polling tick-тің орындалуы:**

```javascript
async function runPollingTick() {
  if (tickRunning) return;
  tickRunning = true;
  try {
    const integrations = await FormIntegration.findAll({
      where: { syncEnabled: true, setupMode: "forms_api_polling" },
      order: [["updatedAt", "ASC"]],
      limit: 50
    });

    for (const integration of integrations) {
      if (integration.syncStatus === "syncing") continue;
      await syncFormIntegration(integration.id);
    }
  } finally {
    tickRunning = false;
  }
}
```

`tickRunning` жалаушасы tick аяқталмай тұрып жаңа tick басталмауын қамтамасыз етеді. Интеграциялар `updatedAt ASC` тәртібімен сортталады — ең ескі жаңартылған интеграция бірінші синхрондалады (round-robin принципі). `limit: 50` шектеуі бір tick-те тым көп интеграцияны өңдеуден қорғайды.

---

#### 4.1.6 Статус және сценарий басқару

FormBridge-дің негізгі ерекшелігі — форма жұмыс кеңістігіне **сценарий** тағайындау мүмкіндігі. Сценарий конфигурациясы `config/formScenarios.js` файлында сақталады.

Жүйеде алты сценарий жобаланды: `universal`, `admissions`, `hr`, `survey`, `client_requests`, `event`. Әр сценарийдің өзіне тән статустар ағымы, AI рөлдік промпты және ұсынылатын сұрақтар жиыны бар:

```javascript
hr: {
  statusFlow: ["new", "shortlisted", "interview", "rejected", "hired"],
  aiRolePrompt: "You are an HR recruiter assistant...",
  suggestedQuestions: {
    kk: ["Үздік үміткерлер кімдер?", "Shortlist жасаңыз", ...],
    ru: ["Кто лучшие кандидаты?", ...],
    en: ["Who are the top candidates?", ...]
  }
}
```

**`getScenario` утилиті:**

```javascript
export function getScenario(id) {
  return formScenarios[id] || formScenarios.universal;
}
```

Бұл функция белгісіз сценарий ID берілген жағдайда қауіпсіз `universal` сценарийін қайтарады — жүйенің бұзылуынан қорғайды.

**Статусты жаңарту.** `PATCH /api/forms/:formId/requests/:requestId` эндпойнті жауаптың статусын өзгертеді. Сервер жаңа статустың сценарийдің `statusFlow` тізімінде бар-жоғын тексермейді — бұл сценарийлер арасында ауысқанда ескі статустардың сақталуына мүмкіндік береді.

---

#### 4.1.7 AI-талдау модулі (OpenAI)

AI функционалдығы `services/openaiService.js` файлында іске асырылды. Жүйеде форма деңгейіндегі AI чат (`formChat`) функциясы жобаланды.

**Жүйелік промптты динамикалық жасау:**

```javascript
function buildSystemPrompt(formTitle, scenario, requests, lang) {
  const scenarioMeta = getScenario(scenario);
  const rolePrompt = scenarioMeta.aiRolePrompt;

  const requestsContext = requests.slice(0, 50).map((r, i) => {
    const answers = r.answers.map(a =>
      `    ${a.question}: ${a.answer}`).join("\n");
    return `[${i+1}] ID: ${r.id} | Status: ${r.status}\n${answers}`;
  }).join("\n\n");

  return `${rolePrompt}\nForm: ${formTitle}\n...\n${requestsContext}`;
}
```

Промпт үш бөліктен тұрады: сценарийге тән рөлдік нұсқаулық (`rolePrompt`), форма атауы мен контекст ақпарат, соңғы 50 жауаптың нормализацияланған мәтіні. Бұл AI-дың форма деректеріне негізделген дәл жауаптар беруіне мүмкіндік береді.

**Сөйлесу тарихы (chat history):**

```javascript
const slicedHistory = history.slice(-10).map(msg => ({
  role: msg.role === "assistant" ? "assistant" : "user",
  content: String(msg.content).trim()
}));

const apiMessages = [
  { role: "system", content: systemPrompt },
  ...slicedHistory,
  { role: "user", content: message }
];
```

Сөйлесу тарихының соңғы 10 хабарламасы ғана OpenAI API-ға жіберіледі — бұл токен шегіне жетуден және шығын артуынан қорғайды.

**[СКРИНШОТ: FormBridge AI чат блогы — «HR / Рекрутинг» сценарийінде «Үздік үміткерлер кімдер?» сұрағына жауап]**

---

#### 4.1.8 WhatsApp хабарламалары және күнделікті есеп

WhatsApp интеграциясы `services/whatsappService.js` және `services/whatsappNotificationService.js` файлдарында іске асырылды. Хабарлама жіберу `whatsapp-web.js` кітапханасы арқылы орындалады.

**Жаңа жауапқа хабарлама жіберу:**

`syncFormIntegration` функциясы жаңа жауаптарды сақтағаннан кейін `notifyForNewRequests(integration.formId, createdRecords)` шақырады. Бұл функция `notification_settings` кестесінен пайдаланушының `notify_on_new = true` баптауы бар-жоғын тексереді. Баптау қосылған жағдайда `sendMessage(phone, text)` арқылы WhatsApp хабарламасы жіберіледі.

Хабарлама форматы:

```
📋 Жаңа өтініш түсті!
Форма: [форма атауы]
Уақыт: [күн уақыт]
```

**Күнделікті есеп (daily digest).** `notificationScheduler.js` файлындағы scheduler тәулік сайын белгіленген уақытта (`digest_time`) жиынтық хабарлама жіберуді орындайды. Есеп форма бойынша статустар бойынша топтастырылған санақты қамтиды.

---

### 4.2 Клиенттік бөлік (Frontend)

#### 4.2.1 React компоненттерінің құрылымы

FormBridge клиенттік бөлігі `frontend/src/` каталогында орналасқан:

```
frontend/src/
├── main.jsx              — React tree іске қосу нүктесі
├── app/
│   └── App.jsx           — Маршрутизация, TopBar, ProtectedRoute
├── pages/
│   ├── HomePage.jsx      — Лендинг беті
│   ├── LoginPage.jsx     — Кіру/тіркелу беті
│   ├── MyFormsPage.jsx   — Формалар тізімі
│   ├── RequestsPage.jsx  — CRM жұмыс кеңістігі
│   └── ProfilePage.jsx   — Профиль беті
├── api/
│   └── client.js         — axios инстансы (Bearer token авто-тіркеу)
└── shared/
    ├── i18n.js           — Барлық аудармалар (kk/ru/en)
    ├── useLocale.js      — Тіл хук
    ├── icons.jsx         — SVG иконалар компоненттері
    ├── Breadcrumb.jsx    — Бредкрамб компоненті
    └── styles/
        └── global.css    — Бірыңғай CSS файл
```

**Маршрутизация.** `App.jsx` файлында `react-router-dom` v6 негізінде маршруттар анықталған. `ProtectedRoute` компоненті `localStorage`-тан `fb_token` кілтімен JWT тексереді — токен жоқ болса `/login`-ге бағыттайды:

```javascript
function ProtectedRoute({ children }) {
  const token = getStoredToken();
  return token ? children : <Navigate to="/login" replace />;
}
```

**API клиенті.** `api/client.js` файлында axios инстансы жасалған, ол барлық сұрауға автоматты `Authorization: Bearer <token>` тақырыбын қосады:

```javascript
api.interceptors.request.use(config => {
  const token = localStorage.getItem("fb_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

---

#### 4.2.2 Форма қосу және байланыстыру интерфейсі

`MyFormsPage.jsx` — пайдаланушының қосқан формаларын тізімдейтін бет. Бет іске қосылғанда `GET /api/forms` эндпойнтына сұрау жасалады, жауаптар карточка форматында бейнеленеді.

Жаңа форма қосу процесі:
1. «Форма қосу» батырмасы Google аккаунтты байланыстырмаған болса `/api/google/auth` эндпойнтына бағыттайды;
2. OAuth аяқталғаннан кейін `/api/google/forms` арқылы пайдаланушының Google Drive-ындағы формалар тізімі жүктеледі;
3. Пайдаланушы форманы таңдайды, `POST /api/forms` эндпойнтына форма ID жіберіледі;
4. Сервер форма интеграциясын жасайды, бірінші синхрондауды дереу орындайды.

Форма карточкасында сценарий белгісі (`scenario-mini-badge`) бейнеленеді — сценарий орнатылған болса рөлдік атауы (мысалы, «Қабылдау комиссиясы»), орнатылмаған болса «Сценарий таңдаңыз» деген шақыру.

**[СКРИНШОТ: MyFormsPage — форма карточкалары сценарий белгілерімен]**

---

#### 4.2.3 CRM жұмыс кеңістігі

`RequestsPage.jsx` — жобаның ең күрделі компоненті, ~1500 жол код. Бет `/forms/:formId/requests` маршрутында орналасқан. Бет іске қосылғанда мынадай API сұраулары параллелді орындалады:

- `GET /api/forms/:formId/workspace` — форма метадеректері, сценарий ақпараты;
- `GET /api/forms/:formId/requests` — өтініштер тізімі (фильтрлермен).

**Жұмыс кеңістігінің табтары.** Бет алты табтан тұрады: `requests`, `analytics`, `ai`, `whatsapp`, `reports`, `feedback`. Белсенді таб `localStorage`-та сақталады — бетті жаңартқанда соңғы ашық таб қайтарылады:

```javascript
const WORKSPACE_TAB_STORAGE_PREFIX = "formbridge.workspace.activeTab.";

function readStoredWorkspaceTab(formId) {
  const tab = localStorage.getItem(`${WORKSPACE_TAB_STORAGE_PREFIX}${formId}`);
  return WORKSPACE_TABS.includes(tab) ? tab : null;
}
```

**Өтініштер кестесі.** Кесте жолдарын басқанда оң жақта мәліметтер панелі ашылады. Панелде барлық жауаптар, статус өзгерту dropdown-ы, менеджер ескертпесі және AI талдау блогы бейнеленеді.

**Статус өзгерту.** Сценарийге сәйкес статус тізімі динамикалық жасалады:

```javascript
const SCENARIO_QUICK_ACTIONS = {
  admissions: ["contacted", "documents_needed", "accepted", "rejected"],
  hr:         ["shortlisted", "interview", "hired", "rejected"],
  event:      ["confirmed", "waiting_payment", "attended", "cancelled"],
  ...
};
```

**Сценарий таңдау баннері.** `scenarioConfiguredAt === null` болған жағдайда кесте үстінде `ScenarioSelectBanner` компоненті бейнеленеді — пайдаланушыны сценарий таңдауға шақырады.

**[СКРИНШОТ: CRM жұмыс кеңістігі — өтініштер кестесі және оң жақ мәліметтер панелі]**

---

#### 4.2.4 Аналитика: доналдық диаграмма, 14 күндік график

`RequestsPage.jsx`-тің `analytics` табы статус бойынша бөлінген диаграмма мен соңғы 14 күндік белсенділік графигін бейнелейді.

**Доналдық диаграмма (Donut chart).** Статустар бойынша өтініштер үлесін SVG арқылы іске асырылған:
- Барлық статустар бойынша санақ жиналады;
- Әр статус үшін SVG `circle` элементінің `stroke-dasharray` және `stroke-dashoffset` мәндері есептеледі;
- Орталықта жалпы өтініштер саны көрсетіледі.

**14 күндік timeline графигі.** Соңғы 14 күн ішінде күн сайын қанша жаңа өтініш түскені гистограмма форматында бейнеленеді. CSS `bar` элементтері мен `height` инлайн стилі арқылы іске асырылған — сыртқы chart кітапханасысыз.

**[СКРИНШОТ: Аналитика табы — доналдық диаграмма және 14 күндік белсенділік графигі]**

---

#### 4.2.5 AI чат блогы

`RequestsPage.jsx`-тегі `AIChatBlock` компоненті форма деңгейіндегі AI чатты іске асырады. Компонент `ai` табында бейнеленеді.

**Жылдам сұрақтар.** Сценарийге сәйкес ұсынылатын сұрақтар батырмалары автоматты бейнеленеді:

```javascript
const suggestedQuestions = workspace?.suggestedQuestions?.[lang] || [];
```

Пайдаланушы батырманы баса немесе өз сұрағын теріп жіберуі мүмкін. Сұрақ `POST /api/ai/form-chat` эндпойнтына жіберіледі, жауап чат хабарлама ретінде бейнеленеді.

**Тіл сәйкестігі.** Пайдаланушы интерфейсінің тілі (`lang` параметрі) API сұрауына да жіберіледі — AI сол тілде жауап береді.

---

#### 4.2.6 Көптілді интерфейс (қаз/рус/ағылшын)

FormBridge интерфейсі үш тілде жұмыс жасайды: қазақша (`kk`), орысша (`ru`), ағылшынша (`en`). Аударма жүйесі `shared/i18n.js` файлында орталықтандырылған.

```javascript
export const i18n = {
  kk: { appName: "FormBridge", myForms: "Менің формаларым", ... },
  ru: { appName: "FormBridge", myForms: "Мои формы", ... },
  en: { appName: "FormBridge", myForms: "My Forms", ... }
};
```

**`useLocale` хук.** Компоненттерде `useLocale()` хуку арқылы ағымдағы тіл мен аудармалар алынады:

```javascript
const { lang, setLang, t } = useLocale();
// t.myForms → тілге байланысты мән
```

Таңдалған тіл `localStorage`-та `fb_lang` кілтімен сақталады. Алғаш кіргенде `LanguageGate` компоненті тіл таңдауды сұрайды.

**TopBar тіл ауыстырғышы.** `TopBar` компонентіндегі `GlobeAltIcon` батырмасы тіл таңдау dropdown-ын ашады. Тіл ауысқанда барлық компоненттер дереу жаңа тілде бейнеленеді — бетті жаңартусыз.

---

### 4.3 Интерфейс дизайны

#### 4.3.1 Дизайн жүйесі

FormBridge интерфейсінің дизайны қарапайым, кәсіби және функционалды болуға бағытталған. Барлық стильдер бір `frontend/src/shared/styles/global.css` файлда сақталады.

**Бренд түстер палитрасы:**

| CSS айнымалысы | Мән | Қолдануы |
|---|---|---|
| `--brand` | `#123b2f` | Негізгі жасыл (батырмалар, белгілер) |
| `--brand-light` | `#e8f0ee` | Ашық жасыл фон |
| `--brand-hover` | `#0e2e24` | Hover күйі |
| `--surface` | `#ffffff` | Карточкалар, панельдер |
| `--bg` | `#f5f6f8` | Бет фоны |
| `--text` | `#1a1a1a` | Негізгі мәтін |
| `--muted` | `#6b7280` | Жарты-мөлдір мәтін |

**Сценарий түстері.** Әр сценарийдің өзіне тән түсті белгісі бар:

| Сценарий | Түс |
|---|---|
| `universal` | Сұр (`#6b7280`) |
| `admissions` | Индиго (`#4f46e5`) |
| `hr` | Күлгін (`#7c3aed`) |
| `survey` | Сарғыш (`#d97706`) |
| `client_requests` | Қызыл (`#dc2626`) |
| `event` | Жасыл (`#059669`) |

**SVG иконалар.** `shared/icons.jsx` файлында барлық иконалар React компонент ретінде жазылған — сыртқы icon кітапханаларына тәуелділік минималды.

**[СКРИНШОТ: FormBridge лендинг беті — hero секцион, бренд түстер]**

---

#### 4.3.2 Адаптивті (мобильді) дизайн

FormBridge интерфейсі мобильді құрылғыларды да қолдайды. CSS media queries арқылы мынадай бейімдеулер іске асырылды:

**TopBar.** Кіші экрандарда навигация сілтемелері жасырылады, тек бренд логотипі, тіл ауыстырғышы және аккаунт мәзірі көрсетіледі.

**Өтініштер кестесі.** Мобильде кесте горизонталь айналатын (`overflow-x: auto`) контейнерге орналастырылған — барлық бағандар мобильде де қолжетімді.

**Аналитика timeline графигі.** 14 күндік график мобильде горизонталь айналуды қолдайды:

```css
@media (max-width: 600px) {
  .timeline-chart-scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
}
```

**CRM мәліметтер панелі.** Мобильде оң жақ панель толық ені бойынша бейнеленеді, кесте уақытша жасырылады — бұл шағын экранда деректерді оқуды жеңілдетеді.

**[СКРИНШОТ: FormBridge мобильді интерфейс — MyFormsPage смартфон экранында]**

---

## 5. ТЕСТІЛЕУ (~7 бет)

> _Статус: жазылмаған_

### 5.1 Тестілеу мақсаты және тәсілдері
### 5.2 Бақылау мысалы: «Қабылдау комиссиясы» сценарийі
### 5.3 OAuth аутентификацияны тестілеу
### 5.4 Google Forms API polling механизмін тестілеу
### 5.5 CRM функцияларын тестілеу
### 5.6 WhatsApp хабарламаларын тестілеу
### 5.7 Тестілеу нәтижелерін бағалау

---

## 6. ЭКОНОМИКАЛЫҚ БӨЛІМ (~5 бет)

> _Статус: жазылмаған_

### 6.1 Әзірлеуге кеткен шығындарды есептеу
### 6.2 Аппараттық/бағдарламалық шығындар
### 6.3 Жобаның экономикалық тиімділігі

---

## 7. ЕҢБЕКТІ ҚОРҒАУ (~4 бет)

> _Статус: жазылмаған_

### 7.1 ЭЕМ-мен жұмыстағы қауіпті факторлар
### 7.2 Жұмыс орнын ұйымдастыру талаптары
### 7.3 Электр және өрт қауіпсіздігі

---

## ҚОРЫТЫНДЫ (1 бет)

> _Статус: жазылмаған_

---

## ПАЙДАЛАНЫЛҒАН ӘДЕБИЕТТЕР ТІЗІМІ (~2 бет)

> _Статус: жазылмаған_

---

## ҚОСЫМШАЛАР

- **Қосымша А** — Пайдаланушы нұсқаулығы
- **Қосымша Б** — Жүйенің архитектуралық схемасы
- **Қосымша В** — Деректер қорының схемасы (ER-диаграмма)
- **Қосымша Г** — Интерфейс скриншоттары
- **Қосымша Д** — Негізгі код фрагменттері
- **Қосымша Е** — Тестілеу нәтижелері

---

_Жазылған бөлімдерді осы файлда белгілеп отырамыз._
