# Промпт для генерации приложения MirrorVote

## Описание проекта

Создай веб-приложение: **MirrorVote — AI-помощник в примерочной**.

Пользователь в примерочной делает несколько фото в разных нарядах, загружает их в приложение. AI через OpenRouter (мультимодальная модель с vision) анализирует каждое фото, вычисляет параметры нормализации (яркость, контраст, масштаб, кроп), применяет CSS-коррекции на клиенте, чтобы фото стали визуально сопоставимы. Затем пользователь сравнивает фото бок о бок и получает AI-рекомендацию — какой наряд смотрится лучше и почему.

**Функциональность:**

1. **Загрузка фото** — пользователь загружает 2–6 фото из примерочной (drag-and-drop или камера телефона). Фото сохраняются в Supabase Storage.

2. **AI-нормализация** — каждое фото отправляется в vision-модель (google/gemini-2.5-flash через OpenRouter). Модель анализирует:
   - Уровень освещения и цветовую температуру → возвращает коррекции: brightness, contrast, warmth
   - Масштаб фигуры в кадре → возвращает рекомендации по кропу (top, bottom, left, right в %)
   - Положение тела (поза, наклон) → возвращает угол и смещение для описания
   
   Результат: JSON с параметрами нормализации для каждого фото. Фронтенд применяет CSS filter (brightness, contrast) и object-position/crop, чтобы фото выглядели одинаково по свету и масштабу.

3. **Сравнение** — интерфейс сравнения:
   - Режим "бок о бок" (side-by-side): 2 фото рядом, свайп или стрелки для переключения
   - Режим "карусель": все фото в ряд с прокруткой
   - Режим "наложение" (overlay): два фото поверх друг друга с ползунком прозрачности
   - Тогл "Оригинал / Нормализованное" — показать фото до и после коррекции

4. **AI-оценка нарядов** — пользователь нажимает "Оценить", AI получает все фото сессии и возвращает:
   - Оценку каждого наряда (1–10) по критериям: посадка, стиль, цветовое сочетание, общее впечатление
   - Текстовое объяснение для каждого наряда
   - Рекомендацию: какой наряд лучше и почему
   - Советы по стилю (с чем сочетать, какие аксессуары подойдут)

5. **Сессии примерок** — история сессий. Каждая сессия = набор фото + результаты анализа. Можно вернуться к прошлым сессиям.

6. **Шеринг** — поделиться сравнением (экспорт коллажа в JPG или ссылка).

**Целевая аудитория:** Люди, которые ходят по магазинам и хотят объективно сравнить наряды из примерочной.

---

## Технологический стек (строго)

### Frontend
- **React 18** + **TypeScript** + **Vite 5** (с @vitejs/plugin-react-swc)
- **Tailwind CSS 3** с плагинами: tailwindcss-animate, @tailwindcss/typography
- **shadcn/ui** (Radix UI примитивы) — компоненты: Button, Card, Input, Textarea, Badge, Dialog, AlertDialog, DropdownMenu, Select, Tabs, ScrollArea, Separator, Progress, Tooltip, Avatar, Toast, Slider, Toggle, ToggleGroup, Carousel, AspectRatio
- **Lucide React** для иконок
- **React Router v6** (BrowserRouter) для маршрутизации
- **React Hook Form** + **Zod** для валидации форм
- **@tanstack/react-query** для серверного состояния
- **date-fns** для работы с датами
- **sonner** для тостов/уведомлений
- **class-variance-authority** + **clsx** + **tailwind-merge** для утилиты cn()
- **embla-carousel-react** для карусели фото
- **file-saver** для экспорта коллажей
- **Canvas API** для генерации коллажей (встроенный, без библиотек)

### Backend
- **Supabase** (облачный):
  - PostgreSQL база данных с RLS (Row Level Security)
  - Auth (email/password + Google OAuth)
  - Edge Functions (Deno runtime) для AI-вызовов
  - Storage для фото (бакет "photos", публичный доступ для авторизованных)

### AI (серверная сторона, через Edge Functions)
- **OpenRouter API** (https://openrouter.ai/api/v1/chat/completions)
- Модель: **google/gemini-2.5-flash** (vision, поддержка изображений)
- Все вызовы AI только из Edge Functions, НЕ из клиента

---

## Архитектура и структура проекта

```
src/
├── main.tsx                         # Точка входа
├── App.tsx                          # Провайдеры + роутинг
├── index.css                        # Tailwind + CSS-переменные + тема
├── pages/
│   ├── Index.tsx                    # Auth guard → /sessions или /auth
│   ├── Auth.tsx                     # Авторизация
│   ├── Sessions.tsx                 # Список сессий примерок
│   ├── NewSession.tsx               # Создание новой сессии (загрузка фото)
│   ├── Compare.tsx                  # Сравнение и оценка фото сессии
│   └── NotFound.tsx                 # 404
├── components/
│   ├── ui/                          # shadcn/ui компоненты
│   ├── session/
│   │   ├── PhotoUploader.tsx        # Drag-and-drop загрузка фото (2–6 штук)
│   │   ├── PhotoGrid.tsx            # Превью загруженных фото с удалением
│   │   ├── CameraCapture.tsx        # Съёмка с камеры телефона (input capture)
│   │   └── SessionCard.tsx          # Карточка сессии в списке
│   ├── compare/
│   │   ├── SideBySide.tsx           # Режим "бок о бок"
│   │   ├── CarouselView.tsx         # Режим карусели
│   │   ├── OverlayView.tsx          # Режим наложения с ползунком
│   │   ├── PhotoCard.tsx            # Отдельное фото с нормализацией (CSS filters)
│   │   ├── NormalizationToggle.tsx  # Тогл "Оригинал / Нормализованное"
│   │   ├── CompareToolbar.tsx       # Панель переключения режимов сравнения
│   │   └── ViewModeSelector.tsx     # Выбор режима просмотра
│   ├── analysis/
│   │   ├── OutfitScore.tsx          # Оценка одного наряда (бар, число, текст)
│   │   ├── OutfitComparison.tsx     # Сравнительная таблица оценок
│   │   ├── AIRecommendation.tsx     # Рекомендация AI (лучший наряд + советы)
│   │   └── StyleTips.tsx            # Советы по стилю
│   ├── share/
│   │   ├── CollageExport.tsx        # Генерация и скачивание коллажа
│   │   └── ShareButton.tsx          # Кнопка "Поделиться"
│   ├── layout/
│   │   ├── AppHeader.tsx            # Шапка: логотип, навигация, язык, аватар
│   │   └── MobileNav.tsx            # Мобильная навигация
│   └── LanguageSwitcher.tsx         # Переключатель языка
├── contexts/
│   ├── AuthContext.tsx               # Авторизация через Supabase
│   └── LanguageContext.tsx           # i18n (ru/en)
├── hooks/
│   ├── usePhotoSession.ts           # CRUD сессий и фото, загрузка в Storage
│   ├── usePhotoNormalization.ts     # Вызов AI-нормализации, хранение параметров
│   ├── useOutfitAnalysis.ts         # Вызов AI-оценки нарядов
│   ├── useCompareMode.ts            # Состояние режима сравнения
│   ├── use-mobile.tsx               # useIsMobile()
│   └── use-toast.ts                 # Toast-система
├── integrations/
│   └── supabase/
│       ├── client.ts                # createClient
│       └── types.ts                 # Database types
├── lib/
│   └── utils.ts                     # cn() helper
└── utils/
    ├── imageUtils.ts                # Ресайз фото перед загрузкой, EXIF-ориентация
    ├── normalizationUtils.ts        # Применение параметров нормализации к CSS
    ├── collageGenerator.ts          # Canvas API: генерация коллажа из фото
    └── constants.ts                 # MAX_PHOTOS=6, MAX_FILE_SIZE, ACCEPTED_FORMATS

supabase/
├── config.toml
├── migrations/
│   └── 001_initial.sql
└── functions/
    ├── normalize-photo/
    │   └── index.ts                 # Анализ фото → параметры нормализации
    ├── analyze-outfits/
    │   └── index.ts                 # Оценка и сравнение нарядов
    └── _shared/
        └── cors.ts                  # Общие CORS-заголовки
```

---

## Паттерны реализации

### Провайдеры (App.tsx)
Порядок вложенности:
```
QueryClientProvider → LanguageProvider → AuthProvider → TooltipProvider → BrowserRouter → Routes
```
Плюс компоненты Toaster и Sonner на верхнем уровне.

### Авторизация (AuthContext)
- `supabase.auth.onAuthStateChange()` для отслеживания состояния
- `supabase.auth.getSession()` для начальной загрузки
- Методы: signIn, signUp, signInWithGoogle, resetPassword, signOut
- Компонент Auth.tsx: три вида (signIn / signUp / forgotPassword) с переключением
- Валидация через Zod-схемы
- Редирект на /auth если не авторизован

### Интернационализация (LanguageContext)
- Два языка: ru, en
- Объект translations с ключами по разделам
- Функция t(key) для получения перевода
- Компонент LanguageSwitcher через DropdownMenu
- Язык по умолчанию: ru

### Работа с Supabase Storage (фото)
```typescript
// Загрузка фото
const filePath = `${userId}/${sessionId}/${photoId}.jpg`;
await supabase.storage.from('photos').upload(filePath, file, {
  contentType: 'image/jpeg',
  upsert: false,
});

// Получение публичного URL
const { data } = supabase.storage.from('photos').getPublicUrl(filePath);
```

### Работа с базой данных
- `supabase.from('table').select('*').eq('user_id', userId).order('created_at', { ascending: false })`
- `.insert([{...}]).select().single()`
- `.update({...}).eq('id', id)`
- `.delete().eq('id', id)`
- RLS: каждый пользователь видит только свои записи

### Edge Functions (Deno) — шаблон
```typescript
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const body = await req.json();
    
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [...],
      }),
    });

    const data = await response.json();
    
    return new Response(JSON.stringify({ result: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

Вызов из клиента: `supabase.functions.invoke('function-name', { body: {...} })`

### Обработка ошибок
- try/catch вокруг async-операций
- toast({ variant: 'destructive' }) для ошибок пользователю
- console.error для логирования
- Edge functions возвращают { error: string } при ошибке

---

## Дизайн-система

### Концепция дизайна
Минималистичный, модный, "fashion-oriented" дизайн. Напоминает эстетику Pinterest и Net-a-Porter. Чистый белый фон с акцентами, много воздуха, фокус на фото.

### Цветовая схема (HSL через CSS-переменные)
Светлая тема (основная):
- Background: чистый белый (#FFFFFF)
- Foreground: почти чёрный (#0A0A0A)
- Primary: тёплый розовый/blush (350 70% 60%) — акцентный цвет для кнопок и CTA
- Secondary: светло-серый (220 10% 96%) — фоны карточек
- Muted: серый (220 10% 92%) — неактивные элементы
- Accent: золотистый (38 90% 55%) — для оценок, звёзд, наград "лучший наряд"
- Destructive: красный (0 84% 60%)

Тёмная тема:
- Background: тёмно-серый (0 0% 7%)
- Primary: светлый розовый (350 70% 72%)
- Accent: приглушённое золото (38 70% 50%)

### Типографика (Google Fonts)
- Sans (основной): **Inter** (400, 500, 600, 700) — чистый современный шрифт
- Serif (заголовки, акценты): **Playfair Display** (400, 600, 700) — fashion-стиль
- Mono: **JetBrains Mono** (400) — для технических деталей (размеры файлов и т.д.)

### Адаптивность
- Mobile-first — основной сценарий: пользователь в примерочной с телефоном
- Телефон: одна колонка, полноширинные фото, нижняя навигация
- Планшет: две колонки для сравнения
- Десктоп: до 3 колонок, боковая панель с оценками

### Компоненты дизайна
- Фото в карточках с мягкой тенью и скруглёнными углами (radius: 1rem)
- Анимации при загрузке фото (fade-in, scale)
- Ползунок наложения (overlay slider) — стеклянный эффект, плавное движение
- Оценки нарядов — круговые прогресс-бары или полоски с градиентом
- Бейдж "AI Pick" (золотой) на лучшем наряде
- Свайп-жесты на мобильных для переключения фото

---

## .env переменные
```
VITE_SUPABASE_URL="https://[project-id].supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJ..."
VITE_SUPABASE_PROJECT_ID="[project-id]"
```

Edge Functions env (в Supabase Dashboard):
```
OPENROUTER_API_KEY="sk-or-..."
```

---

## Страницы и роутинг

| Путь | Компонент | Описание |
|------|-----------|----------|
| `/` | Index | Auth guard → /sessions или /auth |
| `/auth` | Auth | Вход, регистрация, восстановление пароля |
| `/sessions` | Sessions | Список всех сессий примерок |
| `/sessions/new` | NewSession | Загрузка фото для новой сессии |
| `/sessions/:id` | Compare | Сравнение и анализ фото сессии |
| `*` | NotFound | 404 |

---

## Таблицы БД

### `sessions` — сессии примерок
```sql
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Примерка',
  store_name TEXT,                              -- название магазина (опционально)
  status TEXT NOT NULL DEFAULT 'uploading' 
    CHECK (status IN ('uploading', 'normalizing', 'ready', 'analyzed')),
  best_photo_id UUID,                           -- ID лучшего фото (после анализа)
  ai_recommendation TEXT,                       -- текст рекомендации AI
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

### `photos` — фотографии в сессии
```sql
CREATE TABLE public.photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  storage_path TEXT NOT NULL,                   -- путь в Supabase Storage
  photo_url TEXT NOT NULL,                      -- публичный URL
  original_filename TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,        -- порядок фото в сессии
  
  -- Параметры нормализации от AI (JSON)
  normalization JSONB DEFAULT NULL,
  -- Структура: {
  --   "brightness": 1.1,        -- CSS filter brightness (0.5–1.5)
  --   "contrast": 1.05,         -- CSS filter contrast (0.5–1.5)
  --   "warmth": 0,              -- сдвиг тёплый/холодный (-20..+20, CSS hue-rotate)
  --   "cropTop": 5,             -- % обрезки сверху
  --   "cropBottom": 3,          -- % обрезки снизу
  --   "cropLeft": 2,            -- % обрезки слева
  --   "cropRight": 2,           -- % обрезки справа
  --   "scale": 1.0,             -- масштаб (0.8–1.2)
  --   "description": "..."      -- текстовое описание AI: поза, освещение
  -- }
  
  -- Оценка наряда от AI (JSON)
  analysis JSONB DEFAULT NULL,
  -- Структура: {
  --   "overall_score": 8.5,            -- общая оценка 1–10
  --   "fit_score": 9,                  -- посадка
  --   "style_score": 8,                -- стиль
  --   "color_score": 8.5,              -- цветовое сочетание
  --   "description": "...",            -- описание наряда
  --   "pros": ["...", "..."],          -- плюсы
  --   "cons": ["...", "..."],          -- минусы
  --   "style_tips": ["...", "..."]     -- советы по стилю
  -- }
  
  status TEXT NOT NULL DEFAULT 'uploaded' 
    CHECK (status IN ('uploaded', 'normalizing', 'ready', 'error')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

### RLS для обеих таблиц
```sql
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- sessions: CRUD только для своих
CREATE POLICY "Users can view own sessions" ON public.sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own sessions" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.sessions FOR DELETE USING (auth.uid() = user_id);

-- photos: CRUD только для своих
CREATE POLICY "Users can view own photos" ON public.photos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own photos" ON public.photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own photos" ON public.photos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own photos" ON public.photos FOR DELETE USING (auth.uid() = user_id);
```

### Storage bucket
```sql
-- Создать бакет "photos" в Supabase Dashboard
-- Политики: авторизованные пользователи могут загружать в свою папку (userId/sessionId/*)
-- Публичный доступ на чтение для авторизованных
```

### Триггеры updated_at
```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_sessions_updated_at
BEFORE UPDATE ON public.sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_photos_updated_at
BEFORE UPDATE ON public.photos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

---

## Edge Functions

### `normalize-photo` — анализ и нормализация одного фото

**Вход:**
```json
{
  "photoUrl": "https://...supabase.co/storage/v1/object/public/photos/...",
  "allPhotoUrls": ["url1", "url2", "..."]
}
```
`allPhotoUrls` нужен чтобы модель понимала контекст всей серии и нормализовала относительно группы.

**Системный промпт для AI:**
```
Ты — эксперт по фотографии и обработке изображений. Тебе дана серия фотографий из примерочной. Проанализируй указанное фото относительно остальных в серии.

Верни JSON с параметрами нормализации, чтобы все фото серии выглядели одинаково по свету и масштабу:

{
  "brightness": <число 0.5–1.5, 1.0 = без изменений>,
  "contrast": <число 0.5–1.5, 1.0 = без изменений>,
  "warmth": <число -20..+20, 0 = без изменений, CSS hue-rotate в градусах>,
  "cropTop": <% обрезки сверху, 0–15>,
  "cropBottom": <% обрезки снизу, 0–15>,
  "cropLeft": <% обрезки слева, 0–15>,
  "cropRight": <% обрезки справа, 0–15>,
  "scale": <масштаб 0.8–1.2, 1.0 = без изменений>,
  "description": "<краткое описание: поза, освещение, расстояние до зеркала>"
}

Цель: после применения этих параметров ко всем фото, они должны выглядеть так, будто сняты при одинаковом свете, с одинакового расстояния и в одном масштабе.
```

**Выход:**
```json
{
  "normalization": {
    "brightness": 1.1,
    "contrast": 1.05,
    "warmth": -5,
    "cropTop": 3,
    "cropBottom": 2,
    "cropLeft": 1,
    "cropRight": 1,
    "scale": 1.05,
    "description": "Фото чуть темнее остальных, фигура немного дальше от камеры"
  }
}
```

### `analyze-outfits` — сравнительная оценка всех нарядов

**Вход:**
```json
{
  "photoUrls": ["url1", "url2", "url3"],
  "language": "ru"
}
```

**Системный промпт для AI:**
```
Ты — профессиональный стилист и fashion-консультант. Тебе показаны несколько фотографий человека в разных нарядах из примерочной.

Для КАЖДОГО фото (пронумеруй по порядку) верни оценку. Затем дай общую рекомендацию.

Верни строго JSON:
{
  "photos": [
    {
      "index": 0,
      "overall_score": <1-10>,
      "fit_score": <1-10, насколько хорошо сидит>,
      "style_score": <1-10, стиль и актуальность>,
      "color_score": <1-10, цветовое сочетание>,
      "description": "<что за наряд, 1-2 предложения>",
      "pros": ["<плюс 1>", "<плюс 2>"],
      "cons": ["<минус 1>", "<минус 2>"],
      "style_tips": ["<совет 1>", "<совет 2>"]
    }
  ],
  "best_index": <индекс лучшего фото, 0-based>,
  "recommendation": "<общая рекомендация, 2-4 предложения, какой наряд лучше и почему>",
  "comparison": "<краткое сравнение нарядов между собой>"
}

Отвечай на языке: {language}
```

**Выход:**
```json
{
  "analysis": {
    "photos": [...],
    "best_index": 1,
    "recommendation": "Второй наряд смотрится лучше всего...",
    "comparison": "Первый наряд более casual..."
  }
}
```

---

## Ключевые компоненты — детали реализации

### PhotoUploader
- Drag-and-drop зона (onDragOver, onDrop)
- Input type="file" accept="image/*" capture="environment" multiple
- Превью загруженных фото (URL.createObjectURL)
- Ограничения: 2–6 фото, макс 10 МБ каждое, форматы JPG/PNG/HEIC
- Ресайз до 1920px по большей стороне перед загрузкой (Canvas API)
- Прогресс загрузки для каждого фото

### PhotoCard (в режиме сравнения)
- Показывает фото с применёнными CSS-фильтрами нормализации:
```tsx
<div style={{
  filter: `brightness(${n.brightness}) contrast(${n.contrast}) hue-rotate(${n.warmth}deg)`,
  clipPath: `inset(${n.cropTop}% ${n.cropRight}% ${n.cropBottom}% ${n.cropLeft}%)`,
  transform: `scale(${n.scale})`,
}}>
  <img src={photoUrl} />
</div>
```
- Тогл для переключения между нормализованным и оригинальным видом
- Бейдж "AI Pick" с золотым акцентом на лучшем наряде

### SideBySide
- Два фото рядом (grid-cols-2)
- Dropdown для выбора какие фото сравнивать
- Свайп на мобильных (touch events)

### OverlayView
- Два фото наложены друг на друга
- Slider (shadcn) для управления прозрачностью верхнего фото (opacity: 0–1)
- Или split-режим: вертикальный разделитель, слева одно фото, справа другое

### OutfitScore
- Круговой прогресс (SVG circle) с числом в центре
- Цветовая кодировка: красный (1–4), жёлтый (5–7), зелёный (8–10)
- Подкатегории (fit, style, color) — горизонтальные полоски

### AIRecommendation
- Карточка с золотым бордером
- Иконка звезды
- Текст рекомендации с markdown-форматированием
- Список советов по стилю

### CollageExport
- Canvas API: размещает все фото сессии в сетке
- Добавляет оценки и бейдж "Best" на лучшее фото
- Экспорт в JPG через canvas.toBlob() + file-saver

---

## Пользовательский сценарий (User Flow)

1. Пользователь открывает приложение → видит список своих сессий (или пустое состояние с CTA)
2. Нажимает "Новая примерка" → переходит на страницу загрузки
3. Делает фото прямо из приложения (камера) или выбирает из галереи
4. Загружает 2–6 фото → фото уходят в Supabase Storage
5. Нажимает "Выровнять фото" → запускается AI-нормализация для каждого фото
6. Прогресс-бар показывает ход нормализации
7. Когда все фото нормализованы → редирект на страницу сравнения
8. Пользователь переключает режимы (бок о бок / карусель / наложение)
9. Включает/выключает нормализацию тоглом для каждого фото
10. Нажимает "Оценить наряды" → AI анализирует все фото
11. Появляются оценки, рекомендация, советы
12. Лучшее фото помечается золотым бейджем "AI Pick"
13. Пользователь может экспортировать коллаж или поделиться

---

## Требования к реализации

1. Весь код на TypeScript со строгой типизацией
2. Компоненты — функциональные (React FC), с хуками
3. Стили — только Tailwind (никаких CSS-модулей или styled-components)
4. UI-компоненты — только shadcn/ui
5. Состояние — React Context для глобального, useState/useReducer для локального
6. Формы — React Hook Form + Zod
7. Роутинг — React Router v6
8. Все AI-вызовы — только через Edge Functions (не из клиента напрямую)
9. RLS включен для всех таблиц
10. Двуязычность (ru/en) через LanguageContext
11. Адаптивный дизайн (mobile-first) — основной сценарий: телефон в примерочной
12. Тёмная и светлая тема через CSS-переменные и class-based dark mode
13. Фото ресайзить на клиенте перед загрузкой (макс 1920px)
14. Graceful degradation: если AI недоступен — показать фото без нормализации
15. Оптимистичные обновления UI при загрузке фото
