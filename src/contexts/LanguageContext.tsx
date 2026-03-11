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
    'sessions.deleteSelected': 'Удалить выбранные',
    'sessions.empty': 'Пока нет примерок',
    'sessions.emptyDesc': 'Загрузите фото из примерочной и получите AI-оценку нарядов',
    'upload.title': 'Загрузите фото',
    'upload.dragDrop': 'Перетащите фото сюда или нажмите для выбора',
    'upload.camera': 'Сделать фото',
    'upload.gallery': 'Из галереи',
    'upload.addMore': 'Добавить фото',
    'upload.minPhotos': 'Минимум 1 фото',
    'upload.maxPhotos': 'Максимум 6 фото',
    'upload.progress': 'Загрузка...',
    'upload.normalize': 'Simple Look (AI)',
    'upload.clearLookDone': 'Simple Look (AI) применён',
    'upload.continue': 'Продолжить к сравнению',
    'compare.title': 'Сравнение',
    'compare.sideBySide': 'Бок о бок',
    'compare.beforeAfter': 'До/После',
    'compare.carousel': 'Карусель',
    'compare.overlay': 'Наложение',
    'compare.original': 'Оригинал',
    'compare.normalized': 'Simple Look (AI)',
    'compare.backToLook': 'Вернуть Look',
    'compare.pickBest': 'Выбрать лучшую',
    'compare.eliminate': 'Убрать',
    'compare.exclude': 'Исключить',
    'compare.restart': 'Начать заново',
    'compare.winner': 'Победитель!',
    'compare.photosLeft': 'Осталось фото',
    'compare.analyze': 'Оценить наряды (AI)',
    'compare.analyzing': 'Анализ...',
    'compare.chooseOccasion': 'Для какого случая?',
    'compare.chooseBackground': 'Выберите фон',
    'compare.backgroundNeutral': 'Нейтральный',
    'compare.startSimpleLook': 'Применить',
    'compare.cancel': 'Отмена',
    'compare.occasionOffice': 'Офис',
    'compare.occasionDate': 'Свидание',
    'compare.occasionParty': 'Вечеринка',
    'compare.occasionCasual': 'Повседневный',
    'compare.occasionCustom': 'Свой вариант...',
    'compare.startAnalysis': 'Оценить',
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
    'sessions.deleteSelected': 'Delete selected',
    'sessions.empty': 'No sessions yet',
    'sessions.emptyDesc': 'Upload photos from the fitting room and get AI outfit ratings',
    'upload.title': 'Upload Photos',
    'upload.dragDrop': 'Drag and drop photos here or click to select',
    'upload.camera': 'Take Photo',
    'upload.gallery': 'Gallery',
    'upload.addMore': 'Add Photos',
    'upload.minPhotos': 'Minimum 1 photo',
    'upload.maxPhotos': 'Maximum 6 photos',
    'upload.progress': 'Uploading...',
    'upload.normalize': 'Simple Look (AI)',
    'upload.clearLookDone': 'Simple Look (AI) applied',
    'upload.continue': 'Continue to Compare',
    'compare.title': 'Compare',
    'compare.sideBySide': 'Side by Side',
    'compare.beforeAfter': 'Before/After',
    'compare.carousel': 'Carousel',
    'compare.overlay': 'Overlay',
    'compare.original': 'Original',
    'compare.normalized': 'Simple Look (AI)',
    'compare.backToLook': 'Back to Look',
    'compare.pickBest': 'Pick the Best',
    'compare.eliminate': 'Eliminate',
    'compare.exclude': 'Exclude',
    'compare.restart': 'Start Over',
    'compare.winner': 'Winner!',
    'compare.photosLeft': 'Photos left',
    'compare.analyze': 'Rate Outfits (AI)',
    'compare.analyzing': 'Analyzing...',
    'compare.chooseOccasion': 'What occasion?',
    'compare.chooseBackground': 'Choose background',
    'compare.backgroundNeutral': 'Neutral',
    'compare.startSimpleLook': 'Apply',
    'compare.cancel': 'Cancel',
    'compare.occasionOffice': 'Office',
    'compare.occasionDate': 'Date',
    'compare.occasionParty': 'Party',
    'compare.occasionCasual': 'Casual',
    'compare.occasionCustom': 'Custom...',
    'compare.startAnalysis': 'Rate',
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
  const [language, setLanguage] = useState<Language>('en')

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
