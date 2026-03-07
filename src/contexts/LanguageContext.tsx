import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type Language = 'ru' | 'en'

const translations: Record<Language, Record<string, string>> = {
  ru: {
    'app.title': 'MirrorVote',
    'app.tagline': 'AI-помощник в примерочной',
    'auth.signIn': 'Войти',
    'auth.signUp': 'Регистрация',
    'auth.email': 'Email',
    'auth.password': 'Пароль',
    'auth.forgotPassword': 'Забыли пароль?',
    'auth.resetPassword': 'Сбросить пароль',
    'auth.signInWithGoogle': 'Войти через Google',
    'auth.signInAnonymously': 'Войти без регистрации',
    'auth.anonymousWarning': 'Данные гостя могут быть потеряны. Зарегистрируйтесь, чтобы сохранить их.',
    'auth.anonymousBanner': 'Вы вошли как гость.',
    'auth.linkAccount': 'Зарегистрироваться',
    'auth.noAccount': 'Нет аккаунта?',
    'auth.hasAccount': 'Уже есть аккаунт?',
    'sessions.title': 'Мои примерки',
    'sessions.new': 'Новая примерка',
    'sessions.empty': 'Пока нет примерок',
    'sessions.emptyDesc': 'Загрузите фото из примерочной и получите AI-оценку нарядов',
    'upload.title': 'Загрузите фото',
    'upload.dragDrop': 'Перетащите фото сюда или нажмите для выбора',
    'upload.camera': 'Сделать фото',
    'upload.minPhotos': 'Минимум 2 фото',
    'upload.maxPhotos': 'Максимум 6 фото',
    'upload.progress': 'Загрузка...',
    'upload.normalize': 'Выровнять фото',
    'upload.continue': 'Продолжить к сравнению',
    'compare.title': 'Сравнение',
    'compare.sideBySide': 'Бок о бок',
    'compare.carousel': 'Карусель',
    'compare.overlay': 'Наложение',
    'compare.original': 'Оригинал',
    'compare.normalized': 'Нормализованное',
    'compare.analyze': 'Оценить наряды',
    'compare.analyzing': 'Анализ...',
    'analysis.best': 'AI Pick',
    'analysis.score': 'Оценка',
    'analysis.recommendation': 'Рекомендация',
    'analysis.styleTips': 'Советы по стилю',
    'share.export': 'Экспорт коллажа',
    'share.share': 'Поделиться',
    'nav.sessions': 'Примерки',
    'nav.new': 'Новая',
    'nav.logout': 'Выйти',
  },
  en: {
    'app.title': 'MirrorVote',
    'app.tagline': 'AI fitting room assistant',
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.forgotPassword': 'Forgot password?',
    'auth.resetPassword': 'Reset password',
    'auth.signInWithGoogle': 'Sign in with Google',
    'auth.signInAnonymously': 'Continue as guest',
    'auth.anonymousWarning': 'Guest data may be lost. Sign up to keep it.',
    'auth.anonymousBanner': 'You are signed in as a guest.',
    'auth.linkAccount': 'Create account',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'sessions.title': 'My Fitting Sessions',
    'sessions.new': 'New Session',
    'sessions.empty': 'No sessions yet',
    'sessions.emptyDesc': 'Upload photos from the fitting room and get AI outfit ratings',
    'upload.title': 'Upload Photos',
    'upload.dragDrop': 'Drag and drop photos here or click to select',
    'upload.camera': 'Take Photo',
    'upload.minPhotos': 'Minimum 2 photos',
    'upload.maxPhotos': 'Maximum 6 photos',
    'upload.progress': 'Uploading...',
    'upload.normalize': 'Normalize Photos',
    'upload.continue': 'Continue to Compare',
    'compare.title': 'Compare',
    'compare.sideBySide': 'Side by Side',
    'compare.carousel': 'Carousel',
    'compare.overlay': 'Overlay',
    'compare.original': 'Original',
    'compare.normalized': 'Normalized',
    'compare.analyze': 'Rate Outfits',
    'compare.analyzing': 'Analyzing...',
    'analysis.best': 'AI Pick',
    'analysis.score': 'Score',
    'analysis.recommendation': 'Recommendation',
    'analysis.styleTips': 'Style Tips',
    'share.export': 'Export Collage',
    'share.share': 'Share',
    'nav.sessions': 'Sessions',
    'nav.new': 'New',
    'nav.logout': 'Logout',
  },
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('ru')

  const t = useCallback(
    (key: string) => translations[language][key] ?? key,
    [language]
  )

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
