export type UILanguage = 'ar' | 'en';

export const labels: Record<UILanguage, Record<string, string>> = {
  ar: {
    // Menu
    menuTitle: 'قائمة الطعام',
    menuSubtitle: 'اضغط على الصنف أو قل "أضف [الصنف]"',
    searchPlaceholder: 'ابحث في القائمة...',
    noResults: 'لا توجد نتائج لـ',
    add: '+ أضف',
    ordered: 'تم الطلب',

    // Categories
    burgers: 'برجر',
    chicken: 'دجاج',
    pizza: 'بيتزا',
    sides: 'أطباق جانبية',
    drinks: 'مشروبات',
    desserts: 'حلويات',

    // Order
    yourOrder: 'طلبك',
    items: 'أصناف',
    item: 'صنف',
    total: 'الإجمالي',
    confirmOrder: 'تأكيد الطلب',
    clear: 'مسح',
    emptyCart: 'سلتك فارغة',
    emptyCartHint: 'قل "أضف [الصنف]"',
    each: 'للواحد',
    delete: 'حذف',
    newOrder: 'طلب جديد',
    orderConfirmed: 'تم الطلب!',
    thankYou: 'شكراً لطلبك.',
    orderSummary: 'ملخص الطلب',

    // Voice Status
    listening: 'استمع...',
    speaking: 'يتكلم...',
    processing: 'يفكر...',
    connecting: 'يتصل...',
    voice: 'صوت',
    talk: 'تكلم',

    // Chat
    chat: 'محادثة',
    chatTitle: 'المحادثة',
    clearHistory: 'مسح السجل',
    you: 'أنت',
    ai: 'الذكاء',

    // Language
    langCode: 'ar',
  },
  en: {
    // Menu
    menuTitle: 'Menu',
    menuSubtitle: 'Tap an item or say "add [item]"',
    searchPlaceholder: 'Search menu...',
    noResults: 'No results for',
    add: '+ Add',
    ordered: 'Ordered',

    // Categories
    burgers: 'Burgers',
    chicken: 'Chicken',
    pizza: 'Pizza',
    sides: 'Sides',
    drinks: 'Drinks',
    desserts: 'Desserts',

    // Order
    yourOrder: 'Your Order',
    items: 'items',
    item: 'item',
    total: 'Total',
    confirmOrder: 'Confirm Order',
    clear: 'Clear',
    emptyCart: 'Your order is empty',
    emptyCartHint: 'Say "add [item] to order"',
    each: 'each',
    delete: 'Delete',
    newOrder: 'New Order',
    orderConfirmed: 'Order placed!',
    thankYou: 'Thank you for your order.',
    orderSummary: 'Order Summary',

    // Voice Status
    listening: 'Listening...',
    speaking: 'Speaking...',
    processing: 'Thinking...',
    connecting: 'Connecting...',
    voice: 'Voice',
    talk: 'Talk',

    // Chat
    chat: 'Chat',
    chatTitle: 'Chat',
    clearHistory: 'Clear History',
    you: 'You',
    ai: 'AI',

    // Language
    langCode: 'en',
  }
};

export function getCategoryLabel(categoryId: string, lang: UILanguage): string {
  const map: Record<string, Record<UILanguage, string>> = {
    burgers: { ar: labels.ar.burgers, en: labels.en.burgers },
    chicken: { ar: labels.ar.chicken, en: labels.en.chicken },
    pizza: { ar: labels.ar.pizza, en: labels.en.pizza },
    sides: { ar: labels.ar.sides, en: labels.en.sides },
    drinks: { ar: labels.ar.drinks, en: labels.en.drinks },
    desserts: { ar: labels.ar.desserts, en: labels.en.desserts },
  };
  return map[categoryId]?.[lang] || categoryId;
}
