export type Language = 'ru' | 'en';

export interface Translations {
  // Navigation
  dashboard: string;
  clients: string;
  passes: string;
  redeems: string;
  settings: string;
  schedule: string;
  content: string;
  logout: string;

  // Dashboard
  dashboardTitle: string;
  dashboardSubtitle: string;
  monthlyRecurringRevenue: string;
  activeClients: string;
  clientRetention: string;
  monthlyVisits: string;
  activePasses: string;
  expiringSoon: string;
  weeklyVisits: string;
  dropInRevenue: string;
  quickActions: string;
  addClient: string;
  createPass: string;
  viewReports: string;
  revenueBreakdown: string;
  clientOverview: string;
  passDistribution: string;
  upcomingExpirations: string;
  visitStatistics: string;
  currentMonth: string;
  lastMonth: string;
  growth: string;
  totalPrice: string;
  passSales: string;
  dropInSessions: string;
  totalRevenue: string;
  totalClients: string;
  inactiveClients: string;
  retentionRate: string;
  next7Days: string;
  next14Days: string;
  next30Days: string;
  highPriority: string;
  mediumPriority: string;
  lowPriority: string;
  thisMonth: string;

  // Clients
  clientsTitle: string;
  importClients: string;
  addClientButton: string;
  searchByName: string;
  allClients: string;
  activeOnly: string;
  inactiveOnly: string;
  client: string;
  contact: string;
  status: string;
  created: string;
  actions: string;
  active: string;
  inactive: string;
  edit: string;
  archive: string;
  noClientsFound: string;

  // Client Form
  editClient: string;
  parentName: string;
  childName: string;
  phone: string;
  telegram: string;
  instagram: string;
  cancel: string;
  save: string;
  saving: string;
  clientPassCard: string;
  sharePassCard: string;
  scanForDigitalPass: string;
  passUrl: string;
  copyLink: string;
  shareViaTelegram: string;
  sendToParent: string;
  downloadQr: string;
  swimmingPassTicket: string;
  professionalTicket: string;
  shareTicket: string;
  sendAsImage: string;
  printTicket: string;
  currentSwimmingPasses: string;
  loadingPasses: string;
  noActivePassesFound: string;
  sellNewPass: string;
  convertLastVisit: string;
  deductSessions: string;
  convertLastVisitTooltip: string;
  deductSessionsTooltip: string;
  sessionsLabel: string;
  activeStatus: string;
  expiredStatus: string;
  daysShort: string;

  // Pass Actions
  convertLastVisitTitle: string;
  convertLastVisitDescription: string;
  convertVisit: string;
  deductSessionsTitle: string;
  deductSessionsDescription: string;
  sessionsRemaining: string;
  importantNote: string;
  convertWarningText: string;
  sessionsToDeduct: string;
  maxSessions: string;
  currentRemaining: string;
  toDeduct: string;
  afterDeduction: string;
  processing: string;

  // Passes
  passesTitle: string;
  sellPass: string;
  searchByClientName: string;
  type: string;
  progress: string;
  purchased: string;
  lastVisit: string;
  revoke: string;
  noPassesFound: string;
  subscription: string;
  single: string;
  visits: string;

  // Sell Pass Form
  sellSwimmingPass: string;
  selectClient: string;
  searchByParentOrChild: string;
  change: string;
  clientPreselected: string;
  passType: string;
  sessions: string;
  configure: string;
  customPassConfiguration: string;
  priceRsd: string;
  validityDays: string;
  totalPriceLabel: string;
  perSession: string;
  creating: string;

  // Redeems
  redeemsTitle: string;
  searchByClientNameRedeems: string;
  allTypes: string;
  passRedeems: string;
  dropInPayments: string;
  passPurchases: string;
  value: string;
  when: string;
  noRedeemsFound: string;
  justNow: string;
  minutesAgo: string;
  hoursAgo: string;
  daysAgo: string;
  unknownClient: string;

  // Settings
  settingsTitle: string;
  settingsSubtitle: string;
  priceSettings: string;
  priceSettingsDescription: string;
  dropInSessionPrice: string;
  dropInPriceHint: string;
  currency: string;
  passConfigurations: string;
  passConfigurationsDescription: string;
  availablePasses: string;
  addNewPass: string;
  passName: string;
  pricePerSession: string;
  validity: string;
  delete: string;
  generalSettings: string;
  generalSettingsDescription: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  cooldownPeriod: string;
  cooldownHint: string;
  maxDailyRedeems: string;
  maxRedeemsHint: string;
  kioskManagement: string;
  kioskManagementDescription: string;
  manageKiosks: string;
  kioskSettingsDescription: string;
  saveAllSettings: string;

  // Schedule
  scheduleTitle: string;
  scheduleSubtitle: string;
  weeklySchedule: string;
  weeklyScheduleDescription: string;
  bookingSets: string;
  bookingSetsDescription: string;
  addSlot: string;
  noTimeSlotsConfigured: string;
  startTime: string;
  endTime: string;
  capacity: string;
  instructor: string;
  instructorName: string;
  regular: string;
  private: string;
  group: string;
  duration: string;
  people: string;
  saveSchedule: string;
  availableBookingSets: string;
  addBookingSet: string;
  description: string;
  durationMinutes: string;
  color: string;

  // Content
  contentTitle: string;
  contentSubtitle: string;
  createContent: string;
  noContentCreated: string;
  noContentDescription: string;
  title: string;
  message: string;
  priority: string;
  targetAudience: string;
  expiresAt: string;
  activePassHolders: string;
  expiringPasses: string;
  characters: string;
  information: string;
  promotion: string;
  announcement: string;
  warning: string;
  high: string;
  medium: string;
  low: string;
  activate: string;
  deactivate: string;
  expired: string;
  createNewContent: string;
  editContent: string;
  updateContent: string;

  // Common
  loading: string;
  error: string;
  success: string;
  previous: string;
  next: string;
  close: string;
  update: string;
  create: string;
  loadingData: string;
  noDataAvailable: string;
  areYouSure: string;
  confirmAction: string;
  yes: string;
  no: string;
  optional: string;
  required: string;
  language: string;
}

const translations: Record<Language, Translations> = {
  ru: {
    // Navigation
    dashboard: 'Панель управления',
    clients: 'Клиенты',
    passes: 'Абонементы',
    redeems: 'Посещения',
    settings: 'Настройки',
    schedule: 'Расписание',
    content: 'Контент',
    logout: 'Выход',

    // Dashboard
    dashboardTitle: 'Панель управления',
    dashboardSubtitle: 'Обзор плавательного центра и ключевые показатели',
    monthlyRecurringRevenue: 'Ежемесячный доход',
    activeClients: 'Активные клиенты',
    clientRetention: 'Удержание клиентов',
    monthlyVisits: 'Посещения в месяц',
    activePasses: 'Активные абонементы',
    expiringSoon: 'Истекают скоро',
    weeklyVisits: 'Посещения в неделю',
    dropInRevenue: 'Доход от разовых',
    quickActions: 'Быстрые действия',
    addClient: 'Добавить клиента',
    createPass: 'Создать абонемент',
    viewReports: 'Просмотр отчетов',
    revenueBreakdown: 'Структура доходов',
    clientOverview: 'Обзор клиентов',
    passDistribution: 'Распределение абонементов',
    upcomingExpirations: 'Предстоящие истечения',
    visitStatistics: 'Статистика посещений',
    currentMonth: 'Текущий месяц',
    lastMonth: 'Прошлый месяц',
    growth: 'Рост',
    totalPrice: 'Общая цена',
    passSales: 'Продажи абонементов',
    dropInSessions: 'Разовые занятия',
    totalRevenue: 'Общий доход',
    totalClients: 'Всего клиентов',
    inactiveClients: 'Неактивные клиенты',
    retentionRate: 'Уровень удержания',
    next7Days: 'Следующие 7 дней',
    next14Days: 'Следующие 14 дней',
    next30Days: 'Следующие 30 дней',
    highPriority: 'Высокий приоритет',
    mediumPriority: 'Средний приоритет',
    lowPriority: 'Низкий приоритет',
    thisMonth: 'Этот месяц',

    // Clients
    clientsTitle: 'Клиенты',
    importClients: 'Импорт',
    addClientButton: 'Добавить клиента',
    searchByName: 'Поиск по имени...',
    allClients: 'Все клиенты',
    activeOnly: 'Только активные',
    inactiveOnly: 'Только неактивные',
    client: 'Клиент',
    contact: 'Контакты',
    status: 'Статус',
    created: 'Создан',
    actions: 'Действия',
    active: 'Активный',
    inactive: 'Неактивный',
    edit: 'Редактировать',
    archive: 'Архивировать',
    noClientsFound: 'Клиенты не найдены',

    // Client Form
    editClient: 'Редактировать клиента',
    parentName: 'Имя родителя',
    childName: 'Имя ребенка',
    phone: 'Телефон',
    telegram: 'Telegram',
    instagram: 'Instagram',
    cancel: 'Отмена',
    save: 'Сохранить',
    saving: 'Сохранение...',
    clientPassCard: 'Карта абонемента клиента',
    sharePassCard: 'Поделитесь этим QR-кодом или ссылкой с родителем для доступа к абонементу',
    scanForDigitalPass: 'Сканировать для цифрового абонемента',
    passUrl: 'Ссылка на абонемент:',
    copyLink: 'Копировать ссылку',
    shareViaTelegram: 'Отправить в Telegram',
    sendToParent: 'Отправить родителю',
    downloadQr: 'Скачать QR',
    swimmingPassTicket: 'Билет абонемента на плавание',
    professionalTicket: 'Профессиональный билет с информацией о клиенте, QR-кодом и деталями бизнеса',
    shareTicket: 'Поделиться билетом',
    sendAsImage: 'Отправить как изображение',
    printTicket: 'Печать билета',
    currentSwimmingPasses: 'Текущие абонементы на плавание для этого клиента',
    loadingPasses: 'Загрузка абонементов...',
    noActivePassesFound: 'Активные абонементы не найдены',
    sellNewPass: 'Продать новый абонемент',
    convertLastVisit: 'Конвертировать последнее посещение',
    deductSessions: 'Списать занятия',
    convertLastVisitTooltip: 'Конвертировать последнее разовое посещение в использование абонемента',
    deductSessionsTooltip: 'Вручную списать занятия с абонемента',
    sessionsLabel: 'Занятий',
    activeStatus: 'Активен',
    expiredStatus: 'Исчерпан',
    daysShort: 'дн.',

    // Pass Actions
    convertLastVisitTitle: 'Конвертировать посещение',
    convertLastVisitDescription: 'Конвертировать последнее разовое посещение этого клиента в использование абонемента',
    convertVisit: 'Конвертировать посещение',
    deductSessionsTitle: 'Списать занятия',
    deductSessionsDescription: 'Вручную списать занятия с абонемента клиента',
    sessionsToDeduct: 'Количество занятий для списания',
    maxSessions: 'Максимум',
    currentRemaining: 'Сейчас осталось',
    toDeduct: 'Списать',
    afterDeduction: 'После списания',
    sessionsRemaining: 'занятий осталось',
    importantNote: 'Важное примечание',
    convertWarningText: 'Это действие найдет последнее разовое посещение клиента и конвертирует его в использование абонемента. Отменить нельзя.',
    processing: 'Обработка...',

    // Passes
    passesTitle: 'Абонементы',
    sellPass: 'Продать абонемент',
    searchByClientName: 'Поиск по имени клиента...',
    type: 'Тип',
    progress: 'Прогресс',
    purchased: 'Куплен',
    lastVisit: 'Последнее посещение',
    revoke: 'Отозвать',
    noPassesFound: 'Абонементы не найдены',
    subscription: 'Абонемент',
    single: 'Разовое',
    visits: 'посещений',

    // Sell Pass Form
    sellSwimmingPass: 'Продать абонемент на плавание',
    selectClient: 'Выберите клиента',
    searchByParentOrChild: 'Поиск по имени родителя или ребенка...',
    change: 'Изменить',
    clientPreselected: 'Клиент предварительно выбран из профиля',
    passType: 'Тип абонемента',
    sessions: 'Занятий',
    configure: 'Настроить',
    customPassConfiguration: 'Настройка пользовательского абонемента',
    priceRsd: 'Цена (RSD)',
    validityDays: 'Срок действия (дни)',
    totalPriceLabel: 'Общая цена',
    perSession: 'за занятие',
    creating: 'Создание...',

    // Redeems
    redeemsTitle: 'Посещения',
    searchByClientNameRedeems: 'Поиск по имени клиента...',
    allTypes: 'Все типы',
    passRedeems: 'Использование абонементов',
    dropInPayments: 'Разовые платежи',
    passPurchases: 'Покупки абонементов',
    value: 'Значение',
    when: 'Когда',
    noRedeemsFound: 'Посещения не найдены',
    justNow: 'Только что',
    minutesAgo: 'мин назад',
    hoursAgo: 'ч назад',
    daysAgo: 'дн назад',
    unknownClient: 'Неизвестный клиент',

    // Settings
    settingsTitle: 'Настройки',
    settingsSubtitle: 'Настройка абонементов, цен и бизнес-настроек',
    priceSettings: 'Настройки цен',
    priceSettingsDescription: 'Настройка цен на разовые занятия и валюты',
    dropInSessionPrice: 'Цена разового занятия',
    dropInPriceHint: 'Цена за одно занятие без абонемента',
    currency: 'Валюта',
    passConfigurations: 'Конфигурации абонементов',
    passConfigurationsDescription: 'Управление доступными типами абонементов, ценами и сроками действия',
    availablePasses: 'Доступные абонементы',
    addNewPass: 'Добавить новый абонемент',
    passName: 'Название абонемента',
    pricePerSession: 'Цена за занятие:',
    validity: 'Срок действия (дни)',
    delete: 'Удалить',
    generalSettings: 'Общие настройки',
    generalSettingsDescription: 'Настройка информации о бизнесе и поведения системы',
    businessName: 'Название бизнеса',
    businessAddress: 'Адрес бизнеса',
    businessPhone: 'Телефон бизнеса',
    businessEmail: 'Email бизнеса',
    cooldownPeriod: 'Период ожидания (секунды)',
    cooldownHint: 'Минимальное время между последовательными сканированиями',
    maxDailyRedeems: 'Макс. посещений в день',
    maxRedeemsHint: 'Максимальное количество занятий на клиента в день',
    kioskManagement: 'Управление киосками',
    kioskManagementDescription: 'Управление устройствами киосков и настройками доступа',
    manageKiosks: 'Управление киосками',
    kioskSettingsDescription: 'Настройка параметров киосков, генерация PIN-кодов администратора и просмотр зарегистрированных устройств',
    saveAllSettings: 'Сохранить все настройки',

    // Schedule
    scheduleTitle: 'Управление расписанием',
    scheduleSubtitle: 'Настройка регулярного расписания и вариантов бронирования',
    weeklySchedule: 'Недельное расписание',
    weeklyScheduleDescription: 'Настройка регулярных временных слотов для каждого дня недели',
    bookingSets: 'Наборы бронирования',
    bookingSetsDescription: 'Настройка доступных вариантов бронирования и их свойств',
    addSlot: 'Добавить слот',
    noTimeSlotsConfigured: 'Временные слоты не настроены',
    startTime: 'Время начала',
    endTime: 'Время окончания',
    capacity: 'Вместимость',
    instructor: 'Инструктор',
    instructorName: 'Имя инструктора',
    regular: 'Обычное',
    private: 'Частное',
    group: 'Групповое',
    duration: 'мин',
    people: 'человек',
    saveSchedule: 'Сохранить расписание',
    availableBookingSets: 'Доступные наборы бронирования',
    addBookingSet: 'Добавить набор бронирования',
    description: 'Описание',
    durationMinutes: 'Продолжительность (минуты)',
    color: 'Цвет',

    // Content
    contentTitle: 'Управление контентом',
    contentSubtitle: 'Создание и управление рекламным контентом для карт абонементов родителей',
    createContent: 'Создать контент',
    noContentCreated: 'Контент не создан',
    noContentDescription: 'Создайте свой первый рекламный контент для отображения на картах абонементов родителей',
    title: 'Заголовок',
    message: 'Сообщение',
    priority: 'Приоритет',
    targetAudience: 'Целевая аудитория',
    expiresAt: 'Истекает (необязательно)',
    activePassHolders: 'Владельцы активных абонементов',
    expiringPasses: 'Истекающие абонементы',
    characters: 'символов',
    information: 'Информация',
    promotion: 'Акция',
    announcement: 'Объявление',
    warning: 'Предупреждение',
    high: 'Высокий (1)',
    medium: 'Средний (2)',
    low: 'Низкий (3)',
    activate: 'Активировать',
    deactivate: 'Деактивировать',
    expired: 'Истек',
    createNewContent: 'Создать новый контент',
    editContent: 'Редактировать контент',
    updateContent: 'Обновить контент',

    // Common
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успех',
    previous: '← Предыдущая',
    next: 'Следующая →',
    close: 'Закрыть',
    update: 'Обновить',
    create: 'Создать',
    loadingData: 'Загрузка данных...',
    noDataAvailable: 'Данные недоступны',
    areYouSure: 'Вы уверены?',
    confirmAction: 'Подтвердить действие',
    yes: 'Да',
    no: 'Нет',
    optional: 'необязательно',
    required: 'обязательно',
    language: 'Язык',
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    clients: 'Clients',
    passes: 'Passes',
    redeems: 'Redeems',
    settings: 'Settings',
    schedule: 'Schedule',
    content: 'Content',
    logout: 'Logout',

    // Dashboard
    dashboardTitle: 'Dashboard',
    dashboardSubtitle: 'Swimming facility overview and key metrics',
    monthlyRecurringRevenue: 'Monthly Recurring Revenue',
    activeClients: 'Active Clients',
    clientRetention: 'Client Retention',
    monthlyVisits: 'Monthly Visits',
    activePasses: 'Active Passes',
    expiringSoon: 'Expiring Soon',
    weeklyVisits: 'Weekly Visits',
    dropInRevenue: 'Drop-in Revenue',
    quickActions: 'Quick Actions',
    addClient: 'Add Client',
    createPass: 'Create Pass',
    viewReports: 'View Reports',
    revenueBreakdown: 'Revenue Breakdown',
    clientOverview: 'Client Overview',
    passDistribution: 'Pass Distribution',
    upcomingExpirations: 'Upcoming Expirations',
    visitStatistics: 'Visit Statistics',
    currentMonth: 'Current month',
    lastMonth: 'Last month',
    growth: 'Growth',
    totalPrice: 'Total Price',
    passSales: 'Pass Sales',
    dropInSessions: 'Drop-in Sessions',
    totalRevenue: 'Total Revenue',
    totalClients: 'Total Clients',
    inactiveClients: 'Inactive Clients',
    retentionRate: 'Retention Rate',
    next7Days: 'Next 7 days',
    next14Days: 'Next 14 days',
    next30Days: 'Next 30 days',
    highPriority: 'High Priority',
    mediumPriority: 'Medium Priority',
    lowPriority: 'Low Priority',
    thisMonth: 'This Month',

    // Clients
    clientsTitle: 'Clients',
    importClients: 'Import',
    addClientButton: 'Add Client',
    searchByName: 'Search by name...',
    allClients: 'All Clients',
    activeOnly: 'Active Only',
    inactiveOnly: 'Inactive Only',
    client: 'Client',
    contact: 'Contact',
    status: 'Status',
    created: 'Created',
    actions: 'Actions',
    active: 'Active',
    inactive: 'Inactive',
    edit: 'Edit',
    archive: 'Archive',
    noClientsFound: 'No clients found',

    // Client Form
    editClient: 'Edit Client',
    parentName: 'Parent Name',
    childName: 'Child Name',
    phone: 'Phone',
    telegram: 'Telegram',
    instagram: 'Instagram',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving...',
    clientPassCard: 'Client Pass Card',
    sharePassCard: 'Share this QR code or link with the parent to access their swimming pass',
    scanForDigitalPass: 'Scan for Digital Pass',
    passUrl: 'Pass URL:',
    copyLink: 'Copy link',
    shareViaTelegram: 'Share via Telegram',
    sendToParent: 'Send to parent',
    downloadQr: 'Download QR',
    swimmingPassTicket: 'Swimming Pass Ticket',
    professionalTicket: 'Professional ticket with client info, QR code, and business details',
    shareTicket: 'Share Ticket',
    sendAsImage: 'Send as image',
    printTicket: 'Print Ticket',
    currentSwimmingPasses: 'Current swimming passes for this client',
    loadingPasses: 'Loading passes...',
    noActivePassesFound: 'No active passes found',
    sellNewPass: 'Sell New Pass',
    convertLastVisit: 'Convert Last Visit',
    deductSessions: 'Deduct Sessions',
    convertLastVisitTooltip: 'Convert last drop-in visit to pass usage',
    deductSessionsTooltip: 'Manually deduct sessions from pass',
    sessionsLabel: 'Sessions',
    activeStatus: 'Active',
    expiredStatus: 'Expired',
    daysShort: 'days',

    // Pass Actions
    convertLastVisitTitle: 'Convert Visit',
    convertLastVisitDescription: 'Convert the last drop-in visit of this client to pass usage',
    convertVisit: 'Convert Visit',
    deductSessionsTitle: 'Deduct Sessions',
    deductSessionsDescription: 'Manually deduct sessions from client pass',
    sessionsToDeduct: 'Number of sessions to deduct',
    maxSessions: 'Maximum',
    currentRemaining: 'Current remaining',
    toDeduct: 'To deduct',
    afterDeduction: 'After deduction',
    sessionsRemaining: 'sessions remaining',
    importantNote: 'Important Note',
    convertWarningText: 'This action will find the last drop-in visit of the client and convert it to pass usage. This action cannot be undone.',
    processing: 'Processing...',

    // Passes
    passesTitle: 'Passes',
    sellPass: 'Sell Pass',
    searchByClientName: 'Search by client name...',
    type: 'Type',
    progress: 'Progress',
    purchased: 'Purchased',
    lastVisit: 'Last Visit',
    revoke: 'Revoke',
    noPassesFound: 'No passes found',
    subscription: 'Subscription',
    single: 'Single',
    visits: 'visits',

    // Sell Pass Form
    sellSwimmingPass: 'Sell Swimming Pass',
    selectClient: 'Select Client',
    searchByParentOrChild: 'Search by parent or child name...',
    change: 'Change',
    clientPreselected: 'Client preselected from profile',
    passType: 'Pass Type',
    sessions: 'Sessions',
    configure: 'Configure',
    customPassConfiguration: 'Custom Pass Configuration',
    priceRsd: 'Price (RSD)',
    validityDays: 'Validity (Days)',
    totalPriceLabel: 'Total Price',
    perSession: 'per session',
    creating: 'Creating...',

    // Redeems
    redeemsTitle: 'Redeems',
    searchByClientNameRedeems: 'Search by client name...',
    allTypes: 'All Types',
    passRedeems: 'Pass Redeems',
    dropInPayments: 'Drop-in Payments',
    passPurchases: 'Pass Purchases',
    value: 'Value',
    when: 'When',
    noRedeemsFound: 'No redeems found',
    justNow: 'Just now',
    minutesAgo: 'm ago',
    hoursAgo: 'h ago',
    daysAgo: 'd ago',
    unknownClient: 'Unknown client',

    // Settings
    settingsTitle: 'Settings',
    settingsSubtitle: 'Configure passes, prices, and business settings',
    priceSettings: 'Price Settings',
    priceSettingsDescription: 'Configure drop-in session pricing and currency',
    dropInSessionPrice: 'Drop-in Session Price',
    dropInPriceHint: 'Price for single session without a pass',
    currency: 'Currency',
    passConfigurations: 'Pass Configurations',
    passConfigurationsDescription: 'Manage available pass types, pricing, and validity periods',
    availablePasses: 'Available Passes',
    addNewPass: 'Add New Pass',
    passName: 'Pass Name',
    pricePerSession: 'Price per session:',
    validity: 'Validity (Days)',
    delete: 'Delete',
    generalSettings: 'General Settings',
    generalSettingsDescription: 'Configure business information and system behavior',
    businessName: 'Business Name',
    businessAddress: 'Business Address',
    businessPhone: 'Business Phone',
    businessEmail: 'Business Email',
    cooldownPeriod: 'Cooldown Period (seconds)',
    cooldownHint: 'Minimum time between consecutive scans',
    maxDailyRedeems: 'Max Daily Redeems',
    maxRedeemsHint: 'Maximum sessions per client per day',
    kioskManagement: 'Kiosk Management',
    kioskManagementDescription: 'Manage kiosk devices and access settings',
    manageKiosks: 'Manage Kiosks',
    kioskSettingsDescription: 'Configure kiosk settings, generate admin PINs, and view registered devices',
    saveAllSettings: 'Save All Settings',

    // Schedule
    scheduleTitle: 'Schedule Management',
    scheduleSubtitle: 'Configure regular schedules and booking options',
    weeklySchedule: 'Weekly Schedule',
    weeklyScheduleDescription: 'Configure regular time slots for each day of the week',
    bookingSets: 'Booking Sets',
    bookingSetsDescription: 'Configure available booking options and their properties',
    addSlot: 'Add Slot',
    noTimeSlotsConfigured: 'No time slots configured',
    startTime: 'Start Time',
    endTime: 'End Time',
    capacity: 'Capacity',
    instructor: 'Instructor',
    instructorName: 'Instructor name',
    regular: 'Regular',
    private: 'Private',
    group: 'Group',
    duration: 'min',
    people: 'people',
    saveSchedule: 'Save Schedule',
    availableBookingSets: 'Available Booking Sets',
    addBookingSet: 'Add Booking Set',
    description: 'Description',
    durationMinutes: 'Duration (minutes)',
    color: 'Color',

    // Content
    contentTitle: 'Content Management',
    contentSubtitle: 'Create and manage promotional content for parent pass cards',
    createContent: 'Create Content',
    noContentCreated: 'No Content Created',
    noContentDescription: 'Create your first promotional content to display on parent pass cards',
    title: 'Title',
    message: 'Message',
    priority: 'Priority',
    targetAudience: 'Target Audience',
    expiresAt: 'Expires At (Optional)',
    activePassHolders: 'Active Pass Holders',
    expiringPasses: 'Expiring Passes',
    characters: 'characters',
    information: 'Information',
    promotion: 'Promotion',
    announcement: 'Announcement',
    warning: 'Warning',
    high: 'High (1)',
    medium: 'Medium (2)',
    low: 'Low (3)',
    activate: 'Activate',
    deactivate: 'Deactivate',
    expired: 'Expired',
    createNewContent: 'Create New Content',
    editContent: 'Edit Content',
    updateContent: 'Update Content',

    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    previous: '← Previous',
    next: 'Next →',
    close: 'Close',
    update: 'Update',
    create: 'Create',
    loadingData: 'Loading data...',
    noDataAvailable: 'No data available',
    areYouSure: 'Are you sure?',
    confirmAction: 'Confirm action',
    yes: 'Yes',
    no: 'No',
    optional: 'optional',
    required: 'required',
    language: 'Language',
  }
};

class I18nService {
  private currentLanguage: Language = 'ru';
  private listeners: Array<(language: Language) => void> = [];

  constructor() {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'ru' || savedLanguage === 'en')) {
      this.currentLanguage = savedLanguage;
    }
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  setLanguage(language: Language): void {
    this.currentLanguage = language;
    localStorage.setItem('language', language);
    this.notifyListeners();
  }

  getTranslations(): Translations {
    return translations[this.currentLanguage];
  }

  t(key: keyof Translations): string {
    return translations[this.currentLanguage][key];
  }

  subscribe(listener: (language: Language) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentLanguage));
  }
}

export const i18n = new I18nService();

// React hook for using translations
export function useTranslation() {
  const [language, setLanguage] = React.useState(i18n.getCurrentLanguage());

  React.useEffect(() => {
    return i18n.subscribe(setLanguage);
  }, []);

  return {
    t: i18n.t.bind(i18n),
    language,
    setLanguage: i18n.setLanguage.bind(i18n),
    translations: i18n.getTranslations(),
  };
}

// Import React for the hook
import React from 'react';