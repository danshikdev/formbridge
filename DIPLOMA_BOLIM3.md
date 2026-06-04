3 ЖУЙЕНИ ЖОБАЛАУ

3.1 FormBridge жуйесинин жалпы архитектурасы

FormBridge жуйеси клиент-серверлик архитектура негизинде курылган. Жуйе уш негизги катмардан турады: фронтенд колданушы интерфейси, серверлик REST API жане PostgreSQL деректер коры. Осы катмарлардын катарасымен байланысы жуйенин турактылыгын жане модульдилигин камтамасыз етеди.

Фронтенд бологи React 18 каркасына жане Vite 5 курастыру куралына негизделген. Бар бет колданбасы (Single Page Application) принципи бойынша жумыс истейди: бастапкы HTML жуктеледи, одан кейин барлык навигация мен деректер жуктеу браузерде JavaScript аркылы орындалады. Маршрутизация ушин react-router-dom 6 кутапханасы, серверге сурау жиберу ушин axios кутапханасы колданылады.

Серверлик болик Node.js платформасында Express 4 каркасымен жазылган. ESM (ECMAScript Modules) форматы колданылады, яни барлык файлдарда import/export синтаксиси пайдаланылады. Серверге кирген барлык сурау JSON форматында кабылданады, жауаптар да JSON форматында кайтарылады. Деректер коры катынасы Sequelize 6 ORM аркылы жузеге асырылады, деректер кору реттиси PostgreSQL 14+ болып табылады.

Жуйенин жогары денгейдеги архитектуралык схемасы Сурет 3.1-де берилген.

[Сурет 3.1 - FormBridge жуйесинин жалпы архитектуралык схемасы]

Серверди жускирту (bootstrap) кезинде server.js файлы уш негизги фондык процести косады:

1. WhatsApp клиентин инициализациялау (initClient) - whatsapp-web.js аркылы WhatsApp Web сессиясын ашады;
2. Хабарлама жиберу жоспарлаушысын коию (startNotificationScheduler) - кун сайынгы жиынтык хабарламаларды жибереди;
3. Google Forms сурастыру жоспарлаушысын коию (startGoogleFormsPollingScheduler) - Google Forms API-дан жауаптарды периодты тексереди.

Серверлик маршруттар томанде берилген:
- /api/auth - тиркелу, киру, аутентификация;
- /api/forms - форма жаупатарын, workspace жане сценарийди баскару;
- /api/google - Google OAuth аккаунтын баслау;
- /api/integrations - интеграцияны баптау жане тексеру;
- /api/notifications/whatsapp - WhatsApp хабарлама баптаулары;
- /api/ai - AI чат модули;
- /api/admin - администратор операциялары.


3.2 Клиент-серверлик озара арекеттесу

Фронтенд пен бэкенд аралыгындагы барлык коммуникация HTTP REST API аркылы журеди. Фронтенд тарапында axios клиентинин орталыктандырылган данасы frontend/src/api/client.js файлында баяндалган. Бул дана автоматты турде Authorization тактакшасын (header) сурауга косады: токен localStorage жинагынан fb_token килти бойынша алынады.

Колданушы аутентификацияланган кезде JWT токен браузердин localStorage жинагында сакталады. Сурау жибергенде клиент "Authorization: Bearer <token>" тактакшасын автоматты турде косады, ал серверлик requireAuth middleware осы токенди тексереди.

CORS саясаты серверде cors кутапханасы аркылы реттеледи. Рухсат берилген шыгу тегинин (origin) тизими CORS_ORIGIN орта айнымалысынан алынады жане virgulmen белинген тизим ретинде болининиди. Тексеру дал окшаулык принципи бойынша жузеге асырылады: шыгу теги тизимге кирмесе, корем CORS катесимен кери кайтарылады.

Деректер алмасу форматы - JSON. Суроулардын максималды денеси (request body) 1 МБ-пен шектелген. Клиент-серверлик езара арекеттесу схемасы Сурет 3.2-де берилген.

[Сурет 3.2 - Клиент-серверлик езара арекеттесу диаграммасы]

Негизги API маршруттарынын тизими Кесте 3.1-де берилген.

Кесте 3.1 - FormBridge негизги API маршруттары

| Метод | Маршрут                              | Баяндамасы                              |
|-------|--------------------------------------|-----------------------------------------|
| POST  | /api/auth/register                   | Жана колданушыны тиркеу                 |
| POST  | /api/auth/login                      | Электрондык пошта аркылы киру           |
| GET   | /api/auth/me                         | Агымдагы колданушы туралы акпарат       |
| GET   | /api/auth/google/start               | Google аркылы кируди бастау             |
| GET   | /api/auth/google/callback            | Google кери шакыру (callback)           |
| GET   | /api/google/status                   | Google аккаунтынын баланысы             |
| GET   | /api/google/connect                  | Google OAuth интеграциясын бастау       |
| GET   | /api/google/callback                 | Google OAuth кери шакыруы              |
| GET   | /api/google/forms                    | Google Disc-тен формалар тизими        |
| POST  | /api/forms/webhook/google            | Webhook аркылы жауап кабылдау           |
| GET   | /api/forms/requests                  | Жауаптар тизими (сурыптаумен)           |
| GET   | /api/forms/requests/:id              | Бир жауаптын толык деректери            |
| PATCH | /api/forms/requests/:id/status       | Жауап статусын озгерту                  |
| GET   | /api/forms/:formId/workspace         | Форманын workspace акпараты             |
| PATCH | /api/forms/:formId/scenario          | Сценарийди тандау                       |
| POST  | /api/forms/:formId/feedback          | Кери байланыс жиберу                    |
| GET   | /api/forms/:formId/notification-settings | Хабарлама баптауларын алу           |
| PUT   | /api/forms/:formId/notification-settings | Хабарлама баптауларын сактау        |
| POST  | /api/ai/form-chat                    | AI чат хабарламасын жиберу              |
| POST  | /api/integrations/connect            | Форманы баптап, интеграция жасау        |
| POST  | /api/integrations/:id/sync           | Колмен синхрондау                       |


3.3 Деректер корынын курылымы

FormBridge жуйесинде PostgreSQL деректер коры Sequelize ORM аркылы баскарылады. Жуйеде жети кестелик жиын бар: users, google_accounts, form_integrations, requests, integration_events, notification_settings, form_feedback.

Барлык кестелерде бастапкы кили (primary key) ретинде UUID v4 пайдаланылады, ягни DataTypes.UUIDV4 аркылы автоматты генерацияланады. Осы тандау кестелерди горизонталь улкейту кезинде идентификатор кактыгысын болдырмайды жане API аркылы шыгарылган идентификаторлар болжауга тосильген емес.

Деректер корынын ER-диаграммасы Сурет 3.3-те берилген.

[Сурет 3.3 - FormBridge деректер корынын ER-диаграммасы]

3.3.1 users кестеси

users кестеси жуйенин негизги колданушылар каталогы болып табылады. User моделинин олені Кесте 3.2-де берилген.

Кесте 3.2 - users кестесинин олени

| Баган аты    | Дерек тури      | Шектеулер        | Баяндамасы                      |
|--------------|-----------------|------------------|---------------------------------|
| id           | UUID            | PK               | Бирегей идентификатор           |
| fullName     | STRING          | NOT NULL         | Колданушынын толык аты-жони      |
| email        | STRING          | NOT NULL, UNIQUE | Электрондык пошта               |
| passwordHash | STRING          | NOT NULL         | bcryptjs аркылы хэшталган кул сез|
| role         | STRING          | NOT NULL         | Ролi: "user" немесе "admin"     |
| createdAt    | TIMESTAMP       | auto             | Жазба жасалган уакыт            |
| updatedAt    | TIMESTAMP       | auto             | Жазба жаналган уакыт            |

Кул сез bcryptjs кутапханасымен 10 раунд факторымен (cost factor 10) хэшталады. Тиркелу кезинде bcrypt.hash() колданылады, киру кезинде bcrypt.compare() тексеруди жузеге асырады. Кул создин аш-нускасы (plaintext) ешкашан деректер корына сакталмайды жане лог файлдарына жазылмайды.

3.3.2 google_accounts кестеси

google_accounts кестеси колданушынын баланыстырылган Google есептик жазбасын жане OAuth токендерин сактайды. GoogleAccount моделинин олени Кесте 3.3-те берилген.

Кесте 3.3 - google_accounts кестесинин олени

| Баган аты     | Дерек тури | Шектеулер        | Баяндамасы                          |
|---------------|------------|------------------|-------------------------------------|
| id            | UUID       | PK               | Бирегей идентификатор               |
| userId        | UUID       | NOT NULL, UNIQUE | users.id-ге сылтама                 |
| googleUserId  | STRING     |                  | Google аккаунтынын ишки идентификаторы |
| email         | STRING     |                  | Google аккаунтынын электрондык поштасы |
| displayName   | STRING     |                  | Аты-жони                            |
| accessToken   | TEXT       | NOT NULL         | Google OAuth 2.0 кириш токени      |
| refreshToken  | TEXT       |                  | Токенди жанарту токени              |
| scope         | TEXT       |                  | Берилген рухсаттар тизими           |
| tokenType     | STRING     |                  | Токен тури (Bearer)                 |
| expiresAt     | DATE       |                  | Кириш токенинин мерзими             |
| status        | STRING     | NOT NULL         | Баланыс: connected/broken           |
| lastError     | TEXT       |                  | Сонгы кателик хабарламасы           |

userId бага UNIQUE шектеуи бар, ягни бир колданушыга бир гана Google аккаунтын баланыстыруга болады. accessToken мен refreshToken TEXT типинде сакталады, ойткени токен маниндери жатка узын болады. Кириш токенинин мерзими аяктаган кезде жуйе refreshToken аркылы автоматты турде жана accessToken сурайды.

3.3.3 form_integrations кестеси

form_integrations кестеси FormBridge жуйесинин центрлик кестеси болып табылады. Ол колданушынын Google Forms-пен интеграциясынын барлык мета-деректерин, баптау кую, синхрондау жай-куйи мен сценарий акпаратын сактайды.

Кесте 3.4 - form_integrations кестесинин негизги олени

| Баган аты          | Дерек тури | Шектеулер        | Баяндамасы                                   |
|--------------------|------------|------------------|----------------------------------------------|
| id                 | UUID       | PK               | Бирегей идентификатор                        |
| userId             | UUID       |                  | Иегер колданушы                              |
| googleAccountId    | UUID       |                  | Пайдаланылган Google аккаунты                |
| formUrl            | TEXT       | NOT NULL         | Google Forms сilteumasinin URL-и             |
| formId             | STRING     | NOT NULL, UNIQUE | Google Forms-тын форма идентификаторы       |
| formTitle          | STRING     |                  | Форманын атауы                               |
| sheetId            | STRING     |                  | Байланысты Google Sheets идентификаторы      |
| sheetUrl           | TEXT       |                  | Google Sheets силтемесе                      |
| setupMode          | STRING     | NOT NULL         | Баптау режими: manual / forms_api_polling    |
| status             | STRING     | NOT NULL         | Интеграция куйи: draft / ready               |
| healthStatus       | STRING     | NOT NULL         | Денсаулык куйи: unknown / connected / broken |
| lastEventAt        | DATE       |                  | Сонгы окига уакыты                           |
| lastErrorAt        | DATE       |                  | Сонгы кателик уакыты                         |
| lastErrorReason    | TEXT       |                  | Сонгы кателик себебi                         |
| setupChecklist     | JSONB      | NOT NULL         | Баптау кадамдарынын куйи                     |
| formSchema         | JSONB      |                  | Форманын сурактар курылымы                   |
| syncEnabled        | BOOLEAN    | NOT NULL         | Периодты синхрондауга рухсат                 |
| syncStatus         | STRING     | NOT NULL         | Синхрондау куйи: idle / syncing / error      |
| lastSyncedAt       | DATE       |                  | Сонгы синхрондалган уакыт                    |
| lastSyncError      | TEXT       |                  | Сонгы синхрондау кателиги                    |
| scenario           | STRING     | NOT NULL         | Сценарий идентификаторы                      |
| scenarioConfiguredAt | DATE     |                  | Сценарий тандалган уакыт                     |

formId олени UNIQUE шектеуинде болады - жуйеде бир Google формасына тек бир интеграция жасалуы мумкин. setupChecklist JSONB типиндеги объект ретинде сакталады, ол баптаудын кандай кадамдары (googleAccount, form, formSchema, responses, polling) аякталганын корсетеди. formSchema JSONB типинде форманын сурак курылымын (items тизими) сактайды жане жауаптарды нормалдандыру кезинде question атауларын ешши аркылы (questionId -> title) алу ушин пайдаланылады.

3.3.4 requests кестеси

requests кестеси Google Forms-тан алынган барлык жауаптарды сактайды. Жауаптар екi жолмен туседи: forms_api_polling (Google Forms API аркылы периодты сурастыру) немесе webhook (сырткы webhook аркылы).

Кесте 3.5 - requests кестесинин олени

| Баган аты        | Дерек тури | Шектеулер        | Баяндамасы                                |
|------------------|------------|------------------|-------------------------------------------|
| id               | UUID       | PK               | Бирегей идентификатор                     |
| source           | STRING     | NOT NULL         | Дерек козi: google_forms_api / google_forms|
| formId           | STRING     |                  | Форма идентификаторы                      |
| formTitle        | STRING     |                  | Форма атауы                               |
| responseId       | STRING     | NOT NULL, UNIQUE | Google жауап идентификаторы               |
| respondentEmail  | STRING     |                  | Жауап берушинин электрондык поштасы       |
| submittedAt      | DATE       |                  | Жауап берилген уакыт                      |
| answers          | JSONB      | NOT NULL         | Жауаптар масыгы: [{question, answer}]     |
| rawPayload       | JSONB      | NOT NULL         | Козден келген аш деректер                 |
| status           | STRING     | NOT NULL         | Онделу статусы                            |

responseId бага UNIQUE шектеуи аркылы кайталанатын жауаптардын (duplicate) деректер корына жазылмайтыны камтамасыз етиледи. answers бага JSONB типиндеги объектилер масыгы ретинде сакталады, мунда ар объект {question, answer, questionId} олендерден турады. rawPayload олени источниктен келген аш дереклерди (Google Forms API жауабы немесе webhook payload-ы) турнiкейiнше сактайды, бул жоналтукелти сурактарды жоналтукелти талдау ушин пайдалы.

Рухсат берилген статус маниндери барлык сценарийлерди камтиды: new, in_progress, done, test, contacted, documents_needed, accepted, rejected, shortlisted, interview, hired, urgent, waiting_client, confirmed, waiting_payment, cancelled, attended.

3.3.5 integration_events кестеси

integration_events кестеси интеграция окигаларынын журналын (audit log) жургизеди. Ар webhookтын кабылдануы, жауаптын жазылуы немесе статус озгерiсi бир жазба ретинде осы кестеге тусетин болады.

Кесте 3.6 - integration_events кестесинин олени

| Баган аты     | Дерек тури | Шектеулер | Баяндамасы                              |
|---------------|------------|-----------|-----------------------------------------|
| id            | UUID       | PK        | Бирегей идентификатор                   |
| integrationId | UUID       |           | form_integrations.id-ге сылтама         |
| requestId     | UUID       |           | requests.id-ге сылтама                  |
| responseId    | STRING     |           | Google жауап идентификаторы             |
| type          | STRING     | NOT NULL  | Окига тури: ingest / status_change       |
| status        | STRING     | NOT NULL  | Нетиже: ok / error / duplicate          |
| message       | TEXT       |           | Деталды хабарлама                       |
| attempt       | INTEGER    | NOT NULL  | Арекет номири                           |
| payload       | JSONB      |           | Толыктайтын деректер                    |

3.3.6 notification_settings кестеси

notification_settings кестеси хабарламалар каналынын баптауларын сактайды. Бир интеграцияга, бир каналга (whatsapp) тек бир жазба болуы ушин (userId, formId, channel) трио ретинде бирегей индекс коиилди.

Кесте 3.7 - notification_settings кестесинин олени

| Баган аты              | Дерек тури | Шектеулер | Баяндамасы                                     |
|------------------------|------------|-----------|------------------------------------------------|
| id                     | UUID       | PK        | Бирегей идентификатор                          |
| userId                 | UUID       | NOT NULL  | Иегер колданушы                                |
| formId                 | STRING     | NOT NULL  | Форма идентификаторы                           |
| channel                | STRING     | NOT NULL  | Канал: whatsapp                                |
| phoneNumber            | STRING     |           | WhatsApp номери                                |
| enabled                | BOOLEAN    | NOT NULL  | Хабарламалар кисылды/осилды                    |
| mode                   | STRING     | NOT NULL  | Режим: every_submission / threshold / daily_summary |
| thresholdCount         | INTEGER    |           | Есептик праг (threshold режимде)               |
| lastThresholdNotifiedAt| DATE       |           | Сонгы праг хабарламасы уакыты                  |
| dailyTime              | STRING     |           | Кундилик жиберу уакыты HH:MM форматында        |
| lastDailySummaryDate   | STRING     |           | Сонгы кундилик жиынтык жиберилген кун          |

3.3.7 form_feedback кестеси

form_feedback кестеси колданушынын форма немесе сценарий туралы кери байланысын (feedback) сактайды. Бул деректер ишки баптауды жаксартуга арналган.

Кесте 3.8 - form_feedback кестесинин олени

| Баган аты | Дерек тури | Шектеулер | Баяндамасы                          |
|-----------|------------|-----------|-------------------------------------|
| id        | UUID       | PK        | Бирегей идентификатор               |
| userId    | UUID       | NOT NULL  | Жазган колданушы                    |
| formId    | STRING     | NOT NULL  | Форма идентификаторы                |
| scenario  | STRING     |           | Агымдагы сценарий                   |
| message   | TEXT       | NOT NULL  | Кери байланыс мазмуны               |
| status    | STRING     | NOT NULL  | Курделеу куйи: new                  |


3.4 Google Forms API аркылы жауаптарды синхрондау

FormBridge жуйесинде Google Forms жауаптарын алудын екi тасили бар: периодты сурастыру (polling) жане webhook. Негизги жане сенимди тасил - Google Forms API v1 аркылы периодты сурастыру.

3.4.1 Периодты сурастыру (Polling) механизми

Сервер жускирткенде startGoogleFormsPollingScheduler() функциясы шакырылады. Бул функция Node.js ишкерилик setInterval() механизми аркылы периодты тексеруди косады. Аралык уакыт GOOGLE_FORMS_POLL_INTERVAL_MS орта айнымалысынан алынады, ал адепкиси 30 000 миллисекунд (30 секунд) болады. Ен аз рухсат берилген аралык уакыт та 30 секунд болып белгиленген.

Ар тексеру циклинде (runPollingTick) жуйе мынаны орындайды:

1. Деректер корынан syncEnabled = true жане setupMode = "forms_api_polling" шартына сайкес инетграциялар тизимин алады (максимум 50 жазба, updatedAt ASC тарбиесимен);
2. Ар интеграция ушин syncFormIntegration() функциясын шакырады;
3. Кез келген интеграция ушин кателик болса, ол журналга жазылады жане циклдин калган белиги жалгасады.

Кателик болдырмаустырылатын механизм де бар: tickRunning жалауы аркылы алдынгы тексеру аяктамай тургanda жана тексеру баспалатынын болдырмайды.

3.4.2 syncFormIntegration функциясынын жумысы

googleFormsSyncService.js файлындагы syncFormIntegration() функциясы синхрондаудын негизги логикасын жузеге асырады. Функциянын жумыс тизбеги:

1. FormIntegration жазбасын деректер корынан алады; syncStatus = "syncing" деп белгилейди;
2. GoogleAccount моделинен колданушынын Google аккаунты акпаратын алады;
3. getGoogleForm() аркылы https://forms.googleapis.com/v1/forms/{formId} маршрутынан форманын мета-деректерин (атауы, сурактар тизими) алады;
4. listGoogleFormResponses() аркылы https://forms.googleapis.com/v1/forms/{formId}/responses маршрутынан барлык жауаптарды алады; nextPageToken аркылы белектелу (pagination) колдану арнайы цикл ишинде орындалады;
5. Ар жауап ушин normalizeResponse() аркылы нормалдандырылады: responseId жасалады ({formId}:{googleResponseId} форматында), answers масыгы {question, answer, questionId} объектилеринен куралады;
6. Request.findOrCreate() аркылы жауап деректер корына жазылады немесе, егер мундай responseId бурыннан бар болса, тусириледи;
7. Синхрондау нетижелери integration жазбасына жазылады: formSchema, lastSyncedAt, syncStatus = "idle", healthStatus = "connected".

Синхрондауда кателик болган кезде syncStatus = "error", healthStatus = "broken", lastErrorReason толтырылады.

Google Forms API-ды пайдалану ушин kolданушy берген OAuth 2.0 токени аркылы сурау жиберилади. Кириш токенинин мерзими аяктаган кезде getValidAccessToken() функциясы refreshToken аркылы жана accessToken автоматты турде сурайды.

3.4.3 Webhook аркылы жауап кабылдау

forms_api_polling режимине косымша, жуйеде webhook механизми де бар. POST /api/forms/webhook/google маршруты сырткы жуйеден (мысалы, колмен жиберилген сурау) жауапты кабылдайды.

Webhook кабылданган кезде:
1. x-formbridge-secret тактакшасы тексериледи: ол интеграция жазбасындагы webhookSecret немесе FORMBRIDGE_WEBHOOK_SECRET орта айнымалысымен сайкес болуы тиис;
2. responseId олени болуы шарт;
3. 15 секунд ишиндеги жакын жауаптармен денелик мазмун жене электрондык пошта бойынша кайталану (duplicate) тексеруи журеди;
4. Request.findOrCreate() аркылы жазылады;
5. Окига integration_events кестесине журналдалады.

Webhook тексеру куйи (healthStatus) интеграция жазбасына да жазылады: сауатты сурау болса "connected", жараксыз кулпи болса "broken" деп белгиленеди.

Google Forms API-мен жумыс истейтин функциялардын тизими Кесте 3.9-да берилген.

Кесте 3.9 - googleService.js ишиндеги Google API функциялары

| Функция атауы          | Google API маршруты                                        | Баяндамасы                        |
|------------------------|------------------------------------------------------------|-----------------------------------|
| listGoogleForms()      | GET /drive/v3/files?q=mimeType=...form                     | Google Drive-тан формалар тизими |
| getGoogleForm()        | GET /v1/forms/{formId}                                     | Форманын мета-деректери           |
| listGoogleFormResponses()| GET /v1/forms/{formId}/responses                         | Барлык жауаптар (pagination бар)  |
| refreshAccessToken()   | POST https://oauth2.googleapis.com/token                   | Токенди жанарту                   |
| fetchGoogleProfile()   | GET https://www.googleapis.com/oauth2/v2/userinfo          | Google профилин алу               |


3.5 OAuth 2.0 жане JWT аркылы аутентификация

FormBridge жуйесинде аутентификациянын екi жолы бар: электрондык пошта мен кул сез аркылы тиркелу/кiру жане Google OAuth 2.0 аркылы кiру. Екi жол да нетижеде JWT токен береди.

3.5.1 Электрондык пошта аркылы аутентификация

POST /api/auth/register маршруты жана колданушы жасайды. fullName, email, password олендери тексериледи. Email бурыннан бар болса, 409 Conflict кайтарылады. Кул сез bcrypt.hash() аркылы 10 раунд факторымен хэшталады жане passwordHash оленине сакталады. Тиркелу уакытында tokenService.js ишиндеги signAccessToken() аркылы JWT токен генерацияланып, жауапта кайтарылады.

POST /api/auth/login маршруты колданушыны тексереди. Email аркылы деректер корынан User табылады, bcrypt.compare() аркылы кул сез тексериледи. Куле сез дурыс болса, JWT токен жасалады.

3.5.2 Google аркылы кiру (Google Login)

GET /api/auth/google/start маршруты Google авторизация бетине аудару URL-ин генерациялайды. Жай-куйди (state) JWT ретинде кодтайды: {purpose: "google_login"} мазмунымен, 10 минуттык мерзиммен. Бул CSRF шабуылынан корганыс береди.

GET /api/auth/google/callback маршруты Google-ден кери шакырылады. State токени тексериледи, Google-ден кириш кодi токенге айналады, профил акпараты алынады. Колданушы деректер корында User.findOrCreate() аркылы жасалады немесе табылады. JWT токен жасалады жане фронтенд бетине (GOOGLE_LOGIN_SUCCESS_URL) query параметр ретинде тиркеледи.

Жуйеде DEMO_GOOGLE_ACCOUNT_EMAIL орта айнымалысы аркылы тек белгили Google аккаунтына кiру рухсат берилетин тексеру механизми бар. Бул Google OAuth консолиндеги Testing режиминде тек белгили тестiлiк колданушылар ушин тiркелген Google аккаунтпен кiруди шектеп, баска пайдаланушылардын кiруин тосатын механизм болып табылады.

3.5.3 Google Forms интеграциясы ушин OAuth

GET /api/google/connect маршруты колданушынын Google аккаунтын FormBridge-ге баланыстырады (бул - баплауга кiру, жуйеге кiрудан болек). Бул жолда мынадай рухсаттар (scope) сурастырылады:

- openid - OpenID Connect хаттамасы аркылы идентификация;
- email - аккаунт электрондык поштасына кiру;
- profile - профил атауына кiру;
- https://www.googleapis.com/auth/drive.metadata.readonly - Google Drive-тан формалар тизимин алу;
- https://www.googleapis.com/auth/forms.body.readonly - форманын сурак курылымын оку;
- https://www.googleapis.com/auth/forms.responses.readonly - форма жауаптарын оку.

State токени колданушы идентификаторын (userId) JWT ретинде кодтайды, {purpose: "google_oauth"} мазмунымен. Callback кезинде state тексериледи, токендер GoogleAccount жазбасына сакталады немесе жаналады.

3.5.4 JWT аутентификация middleware

requireAuth middleware (backend/src/middleware/auth.js) барлык каупли маршруттарда колданылады. Жумыс принципи:

1. Authorization: Bearer <token> тактакшасы тексериледи;
2. jwt.verify() аркылы токен тексериледи - кол (signature) жане мерзим (expiry) тексеруди камтиды;
3. JWT payload.sub (Subject) олени бойынша User деректер корынан алынады;
4. Колданушы объектиси req.user-га тагайындалады жане кейинги middleware-лер мен контроллерлер оган кiре алады.

JWT кулпы env.jwtSecret орта айнымалысынан алынады. Адепки куйде "dev_secret_change_me" болады, бирак ондiрiстiк ортада JWT_SECRET орта айнымалысы аркылы мiндетти турде озгертiлуi тиiс.

Аутентификация ауысу диаграммасы Сурет 3.4-те берилген.

[Сурет 3.4 - FormBridge аутентификация ауысу диаграммасы]


3.6 Сценарийге багытталган workspace моделi

FormBridge жуйесинин орталык идеясы - бiр Google Forms = бiр workspace. Ар workspace-ке сценарий тагайындалады, ол жауаптарды онделу агымын, статус тiзбегiн жане AI контекстiн аниктайды.

3.6.1 Сценарийлер жиыны

formScenarios.js файлында алты сценарий аныкталган:

Кесте 3.10 - FormBridge сценарийлерi

| Сценарий ID    | Атауы (казакша)       | Статус тiзбегi                                                  |
|----------------|-----------------------|------------------------------------------------------------------|
| universal      | Жалпылама режим       | new, in_progress, done                                           |
| admissions     | Кабылдау комиссиясы   | new, contacted, documents_needed, accepted, rejected             |
| hr             | HR / Рекрутинг        | new, shortlisted, interview, rejected, hired                     |
| survey         | Сауалнама             | (статус агымы жок)                                               |
| client_requests| Клиент отiнiштерi     | new, urgent, in_progress, waiting_client, done                   |
| event          | Iс-шара тiркеу        | new, confirmed, waiting_payment, cancelled, attended             |

Ар сценарий мынадай метадеректерден турады: id, title (kk/ru/en), shortDescription, workspaceTitle, primaryGoal, statusFlow масыгы, aiRolePrompt (AI рол нускаулыгы), suggestedQuestions (AI ушiн усынылган сурактар, кк/ру/еn тилдеринде).

getScenario(id) функциясы берiлген идентификатор бойынша сценарийдi кайтарады; белгiсiз идентификатор болса, адепкi universal сценарийi кайтарылады.

3.6.2 Workspace API

GET /api/forms/:formId/workspace маршруты агымдагы жумыс аланынын (workspace) толык акпаратын кайтарады. Жауапта мынадай белiктер болады:

- form: интеграция мета-деректерi (id, title, status, healthStatus, setupMode, syncEnabled, lastSyncedAt т.б.);
- scenario: агымдагы сценарий идентификаторы;
- scenarioConfiguredAt: сценарий тандалган уакыт (null болса - сценарий тандалмаган);
- scenarioMeta: title, shortDescription, workspaceTitle, primaryGoal, statusFlow, suggestedQuestions;
- stats: барлыгы (total), бугiн (today), 7 кун (week), жана (new) жауаптар санагы.

PATCH /api/forms/:formId/scenario маршруты сценарийдi озгертедi. Пайдаланушынын бул формага иелiгi userId шарты аркылы тексеrileди. Сценарий тандалган кезде scenarioConfiguredAt = new Date() белгiленедi.

3.6.3 Жауаптар статусын баскару

PATCH /api/forms/requests/:id/status маршруты жауаптын статусын озгертедi. Барлык сценарийлердiн жиынтык статус тiзiмi (18 мани) тексерiлiп, жараксыз мани болса 400 Bad Request кайтарылады. Статус озгерiсi integration_events кестесiне журналданады.

Фронтенд тарапынан RequestsPage.jsx колданушыга сценарийдiн statusFlow тiзбегi бойынша сурыптауды жане статусты тiкелей тiзiмнен озгертудi мумкiн етедi.


3.7 Хабарлама жане AI модульдерiн жобалау

3.7.1 WhatsApp хабарлама модулi

FormBridge жуйесiнде WhatsApp хабарлама жиберу ушiн whatsapp-web.js кутапханасы колданылады. Бул кутапхана WhatsApp Web интерфейсiн браузерсiз (headless Chromium аркылы Puppeteer) эмуляциялайды. Бул шешiм MVP (Minimum Viable Product) денгейiндегi демо ретiнде жасалган. Ондiрiстiк жуйелерде WhatsApp Business API (Meta аркылы лицензияланган) колдану усынылады, ол ресми API интеграциясын, сенiмдi мессенджер жибередi жане аккаунтты бан болу каупiн азайтады.

Сервер жускiрткенде initClient() функциясы шакырылады. Клиент LocalAuth аутентификация стратегиясымен инициализацияланады - сессия деректерi ./whatsapp-session каталогында сакталады. Сервер терминалында QR-код пайда болады, колданушы оны смартфонымен сканерлеп, сессияны ашады.

Байланыс куйлерi: disconnected, connecting, qr_ready, connected, error. Байланыс орнаткан кезде (connected) sendMessage() функциясы жумыс iстейдi.

Хабарлама жиберу кезiнде телефон номерi казакстандык форматка нормалданады: 8-мен басталатын 11 санды немесе 10 санды номерлер +7 форматына аударылады.

3.7.2 Хабарлама режимдерi

Хабарламалар уш режимде жiберiледi:

every_submission - Ар жана жауап тускен кезде дереу хабарлама жiберiледi. Хабарламада форманын атауы, жауаптушынын электрондык поштасы, берiлген уакыт, статусы жане жауаптардын кыскаша тiзiмi (максимум 4 жауап) болады.

threshold - Жiберу аралыгынан берi жауаптардын саны thresholdCount шегiнен аскан кезде хабарлама жiберiледi. Сан шегi Request.count() аркылы деректер корынан санакталады.

daily_summary - Кундiлiк жиынтык хабарламасы. startNotificationScheduler() setInterval аркылы 60 секунд сайын тексередi. Баптаудагы dailyTime (HH:MM) Алматы уакытымен (UTC+5) болгiлы уакытта аткарылады. Хабарламада кунгi жауаптар саны сценарий статустары бойынша болiнiп берiледi.

Кундiлiк жиынтык жiберiлер алдында, синхрондау активтi интеграциялар ушiн forms_api_polling аркылы жана жауаптар жiктелiп алынады.

3.7.3 AI чат модулi

AI модулi backend/src/services/openaiService.js файлында жузеге асырылган жане OpenAI API-га (openai npm пакетi) негiзделген.

formChat() функциясы форма денгейiндегi чатты орындайды. Функция мынадай параметрлердi кабылдайды: formTitle, scenario, requests (сонгы 50 жауап), message (колданушы хабарламасы), history (соцгы 10 хабарлама), lang (тiл: kk/ru/en).

Жуйелiк промпт (system prompt) мынадан турады:
1. Сценарийдiн aiRolePrompt - ролдiк нускаулык (мысалы, HR сценарийi ушiн: "You are an HR recruiter assistant...");
2. Форма атауы, сценарий идентификаторы, жауаптар саны;
3. Жауаптарды сыралаган мазмун (ID, статус, берiлген уакыт, электрондык пошта, ар жауаптын сурак-жауап мазмуны);
4. Пайдаланылатын тiл нускаулыгы.

Колданыс тiлi lang параметрi аркылы аиктан корсетiледi. OpenAI модели ортада OPENAI_MODEL айнымалысынан алынады, адепкiсi "gpt-5-nano".

POST /api/ai/form-chat маршруты FormIntegration.findOne() аркылы колданушынын сол формага иелiгiн тексередi, одан кейiн Request.findAll() аркылы соцгы 50 жауапты алады жане formChat() шакырады.

AI модулiнiн схемалык диаграммасы Сурет 3.5-те берiлген.

[Сурет 3.5 - FormBridge AI чат модулiнiн жумыс схемасы]


3.8 Акпараттык кауiпсiздiк жане деректердi коргау

FormBridge жуйесiнде аутентификациялау, авторизациялау жане деректердi коргаудын бiрнеше кабаты бар.

3.8.1 Аутентификация жане авторизация

Барлык каупли API маршруттарына requireAuth middleware кою арнайы мiндет болды. Middleware Authorization тактакшасынын болуiн, токен форматын, JWT колынын дурыстыгын жане мерзiмiн тексередi. Токен дурыс болса, деректер корынан колданушы jne алынады - ягни базада жок болинып кетiлген колданушылардын токендерi жарамсыз деп есептеледi.

Сценарий мен workspace операцияларында тек иесiнiн (userId шарты) ол форманы кора алатыны FormIntegration.findOne({ where: { formId, userId } }) аркылы тексерiледi. Чат (AI) маршрутында да осыл принцип колданылады.

3.8.2 Кулпылар мен кулпи акпаратты баскару

Жуйенiн барлык сыртпи кулпылары (JWT_SECRET, OPENAI_API_KEY, GOOGLE_CLIENT_SECRET, DB_PASSWORD, FORMBRIDGE_WEBHOOK_SECRET) тек сервер тарапынан колданылатын орта айнымалылары (.env файл) аркылы берiледi. Бул акпараттардын ешбiрi:
- фронтендке (VITE_* арнайы айнымалылармен де) берiлмейдi;
- деректер корына жазылмайды;
- API жауаптарында кайтарылмайды;
- журнал (log) файлдарына жазылмайды.

env.js файлы орта айнымалыларын орталыктандырып баскарады. Барлык баска файлдар process.env-ге тiкелей сiлтемей, env объектiсiн пайдаланады.

webhookSecret ар интеграцияга жеке болады немесе жалпы FORMBRIDGE_WEBHOOK_SECRET-тан алынады. Вебхукке кiру ушiн x-formbridge-secret тактакшасы мiндеттi.

3.8.3 CORS жане деректер тексеруi

CORS саясаты тек CORS_ORIGIN тiзiмiнде тiркелген шыгу тегiне рухсат бередi. Белгiсiз шыгу тегiне сурау жiберiлсе, CORS қатесi кайтарылады.

JSON денесiнiн максималды колемi 1 МБ-пен шектелген (express.json({ limit: "1mb" })).

Контроллерлерде кiрiс акпарат маниндерi тексерiледi: мысалы updateRequestStatus функциясында status manii рухсат берiлген 18 мани тiзiмiне кiредi ме деп тексерiледi; сценарий тандауда SCENARIO_IDS тiзiмiне кiруi тексерiледi.

3.8.4 Google OAuth кауiпсiздiгi

OAuth 2.0 авторизациясы кезiнде CSRF шабуылынан коргану ушiн state параметрi колданылады. State параметрi JWT ретiнде колтаньылады, онда purpose "google_oauth" немесе "google_login" болуы тексерiледi. Мерзiм 10 минутпен шектелген.

refreshToken деректер корына TEXT типiнде сакталады. Кiрiс токенiнiн мерзiмi аяктаудан 60 секунд бурын жана токен автоматты сурастырылады (getValidAccessToken функциясы). Баланыс узiлсе немесе refresh токен жарамсыз болса, GoogleAccount.status = "broken" деп белгiленедi.

3.8.5 Деректер базасы денгейiндегi корганыс

Деректер корына сурауларда ORM (Sequelize) пайдалану SQL инъекциясынан корганыс бередi: барлык параметрлер мани байланыстыру (parameterized queries) аркылы жiберiледi, аш SQL конкатенациясы жок.

Аутентификацияланган колданушы тек озiне тиiстi деректерге кiре алады, бул controller денгейiнде userId шарты аркылы камтамасыз етiледi. Жалпы деректер карнаушылар (public endpoints) минималды - тек /health денсаулык тексеруi жане /api/forms/webhook/google webhook кiрiсi. Webhook маршруты кулпi аркылы корылады.

3.8.6 Тiркелу жане аудит журналы

integration_events кестесi барлык маныздан окигалардын (жауап кабылдандыру, кайталану аныкталуы, статус озгерiсi, кателiктер) жазбаларын сактайды. Ар жазбада: okiga тури, нетижесi (ok/error/duplicate), детальды хабарлама, тиiстi интеграция мен сурау идентификаторлары болады. Бул аудит журналы функционалды кателiктердi диагностикалауга жане деректердiн тутасдыгын тексеруге мумкiндiк бередi.

---

3 бiлiмнiн бас корытынды

Осы болiмде FormBridge жуйесiнiн толык архитектуралык жобасы карастырылды. Жуйе клиент-серверлiк архитектурада, Node.js/Express сервер жане React/Vite фронтенд кабатынан, PostgreSQL деректер корынан турады. Жети кестелiк мадел (users, google_accounts, form_integrations, requests, integration_events, notification_settings, form_feedback) аркылы деректер структурасы аниктан сипатталды.

Google Forms API v1 аркылы периодты сурастыру (setInterval негiзiндегi polling) механизмi жауаптарды 30 секунд сайын автоматты жаналтады. OAuth 2.0 рухсат протоколы аркылы тек формалар мен жауаптарды оку ушiн минималды рухсаттар сурастырылады. JWT аутентификация middleware барлык каупли маршруттарды кориди.

Сценарийге негiзделген workspace моделi (алты сценарий) жуйенi алуан мекемелерде (кабылдау комиссиясы, HR, клиент кызмет, iс-шара) пайдалануга икемдi кылады. AI модулi OpenAI API аркылы форма денгейiнде чат мумкiндiгiн бередi, онда сценарийдiн рол нускаулыгы жане нактi форма жауаптары контекст ретiнде пайдаланылады.

WhatsApp хабарлама модулi MVP денгейiнде whatsapp-web.js кутапханасы аркылы жузеге асырылган; ондiрiстiк ортада WhatsApp Business API колдану усынылады. Ушi хабарлама режимi (ар жауапка, шекке жеткенде, кундiлiк жиынтык) iс-корiнiс барысынын кагаздарынын баптауын кенейтеди.
