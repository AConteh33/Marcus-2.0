export interface MenuItem {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  nameAr: string;
  items: MenuItem[];
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export const menuCategories: MenuCategory[] = [
  {
    id: 'burgers',
    name: 'Burgers',
    nameAr: 'برجر',
    items: [
      { id: 'b1', name: 'Classic Burger', nameAr: 'برجر كلاسيكي', description: 'Beef patty, lettuce, tomato, pickles, special sauce', descriptionAr: 'لحم بقري، خس، طماط، مخلل، صوص خاص', price: 8.99, category: 'burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop', available: true },
      { id: 'b2', name: 'Cheese Burger', nameAr: 'برجر بالجبن', description: 'Classic with melted cheddar cheese', descriptionAr: 'كلاسيكي مع جبن شيدر ذائب', price: 9.49, category: 'burgers', image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop', available: true },
      { id: 'b3', name: 'Bacon Burger', nameAr: 'برجر بالبيكون', description: 'Classic with crispy bacon strips', descriptionAr: 'كلاسيكي مع شرائح بيكون مقرمشة', price: 10.99, category: 'burgers', image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&h=300&fit=crop', available: true },
      { id: 'b4', name: 'Mushroom Burger', nameAr: 'برجر بالفطر', description: 'Sauteed mushrooms and Swiss cheese', descriptionAr: 'فطر مقلي وجبن سويسري', price: 10.49, category: 'burgers', image: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop', available: true },
      { id: 'b5', name: 'Double Stack', nameAr: 'دبل ستاك', description: 'Two beef patties, double cheese, all the fixings', descriptionAr: 'طبقتان لحم، جبن مزدوج، كل الإضافات', price: 13.99, category: 'burgers', image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=300&fit=crop', available: true },
    ]
  },
  {
    id: 'chicken',
    name: 'Chicken',
    nameAr: 'دجاج',
    items: [
      { id: 'c1', name: 'Chicken Sandwich', nameAr: 'ساندويتش دجاج', description: 'Crispy fried chicken, coleslaw, pickles', descriptionAr: 'دجاج مقلي مقرمش، سلطة كoleslaw، مخلل', price: 9.99, category: 'chicken', image: 'https://images.unsplash.com/photo-1606756790138-261d2b21cd75?w=400&h=300&fit=crop', available: true },
      { id: 'c2', name: 'Grilled Chicken Wrap', nameAr: 'لفافة دجاج مشوي', description: 'Grilled chicken, veggies, ranch in a tortilla', descriptionAr: 'دجاج مشوي، خضروات، صوص رانش في تورتيلا', price: 10.49, category: 'chicken', image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop', available: true },
      { id: 'c3', name: 'Chicken Wings (8pc)', nameAr: 'أجنحة دجاج (8 قطع)', description: 'Choice of buffalo, BBQ, or garlic parm', descriptionAr: 'اختيار من بافالو، باربكيو، أو ثوم بارميزان', price: 12.99, category: 'chicken', image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&h=300&fit=crop', available: true },
      { id: 'c4', name: 'Chicken Tenders', nameAr: 'تندر دجاج', description: '5 crispy tenders with dipping sauce', descriptionAr: '5 قطع تندر مقرمشة مع صوص الغمس', price: 8.99, category: 'chicken', image: 'https://images.unsplash.com/photo-1562967916-eb82221dfb44?w=400&h=300&fit=crop', available: true },
    ]
  },
  {
    id: 'pizza',
    name: 'Pizza',
    nameAr: 'بيتزا',
    items: [
      { id: 'p1', name: 'Margherita', nameAr: 'مارغريتا', description: 'Tomato sauce, mozzarella, fresh basil', descriptionAr: 'صلصة طماطم، موزاريلا، بقدونس طازج', price: 11.99, category: 'pizza', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop', available: true },
      { id: 'p2', name: 'Pepperoni', nameAr: 'بيبروني', description: 'Classic pepperoni with mozzarella', descriptionAr: 'بيبروني كلاسيكي مع موزاريلا', price: 12.99, category: 'pizza', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop', available: true },
      { id: 'p3', name: 'BBQ Chicken Pizza', nameAr: 'بيتزا دجاج باربكيو', description: 'BBQ sauce, chicken, red onion, cilantro', descriptionAr: 'صوص باربكيو، دجاج، بصل أحمر، كزبرة', price: 13.99, category: 'pizza', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop', available: true },
      { id: 'p4', name: 'Veggie Supreme', nameAr: 'خضروات سوبريم', description: 'Bell peppers, mushrooms, olives, onions, tomatoes', descriptionAr: 'فلفل حلو، فطر، زيتون، بصل، طماطم', price: 12.49, category: 'pizza', image: 'https://images.unsplash.com/photo-1511689660979-10d2b1aada49?w=400&h=300&fit=crop', available: true },
    ]
  },
  {
    id: 'sides',
    name: 'Sides',
    nameAr: 'أطباق جانبية',
    items: [
      { id: 's1', name: 'French Fries', nameAr: 'بطاطس مقلية', description: 'Crispy golden fries', descriptionAr: 'بطاطس مقلية ذهبية مقرمشة', price: 3.99, category: 'sides', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop', available: true },
      { id: 's2', name: 'Onion Rings', nameAr: 'حلقات البصل', description: 'Beer-battered onion rings', descriptionAr: 'حلقات بصل مقليرة بالبيرة', price: 4.99, category: 'sides', image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&h=300&fit=crop', available: true },
      { id: 's3', name: 'Coleslaw', nameAr: 'سلطة كoleslaw', description: 'Creamy coleslaw', descriptionAr: 'سلطة كريمية', price: 2.99, category: 'sides', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop', available: true },
      { id: 's4', name: 'Mozzarella Sticks', nameAr: 'أعواد الموزاريلا', description: '6 pieces with marinara sauce', descriptionAr: '6 قطع مع صوص المارينارا', price: 5.99, category: 'sides', image: 'https://images.unsplash.com/photo-1531749668029-2db88e4875de?w=400&h=300&fit=crop', available: true },
      { id: 's5', name: 'Loaded Fries', nameAr: 'بطاطس محشوة', description: 'Fries topped with cheese, bacon, and sour cream', descriptionAr: 'بطاطس مع جبن، بيكون، وكريمة حامضة', price: 6.99, category: 'sides', image: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=400&h=300&fit=crop', available: true },
    ]
  },
  {
    id: 'drinks',
    name: 'Drinks',
    nameAr: 'مشروبات',
    items: [
      { id: 'd1', name: 'Coca-Cola', nameAr: 'كوكا كولا', description: 'Classic Coke', descriptionAr: 'كوكا كولا كلاسيك', price: 2.49, category: 'drinks', image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop', available: true },
      { id: 'd2', name: 'Sprite', nameAr: 'سبرايت', description: 'Lemon-lime soda', descriptionAr: 'صوص ليمون وليمون', price: 2.49, category: 'drinks', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=300&fit=crop', available: true },
      { id: 'd3', name: 'Iced Tea', nameAr: 'شاي ثلج', description: 'Freshly brewed iced tea', descriptionAr: 'شاي ثلج طازج', price: 2.49, category: 'drinks', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop', available: true },
      { id: 'd4', name: 'Milkshake', nameAr: 'ميلك شيك', description: 'Vanilla, chocolate, or strawberry', descriptionAr: 'فانيليا، شوكولاتة، أو فراولة', price: 5.99, category: 'drinks', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop', available: true },
      { id: 'd5', name: 'Coffee', nameAr: 'قهوة', description: 'Hot or iced coffee', descriptionAr: 'قهوة ساخنة أو ثلج', price: 2.99, category: 'drinks', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop', available: true },
      { id: 'd6', name: 'Water', nameAr: 'ماء', description: 'Bottled water', descriptionAr: 'ماء في زجاجة', price: 1.49, category: 'drinks', image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop', available: true },
    ]
  },
  {
    id: 'desserts',
    name: 'Desserts',
    nameAr: 'حلويات',
    items: [
      { id: 'de1', name: 'Chocolate Brownie', nameAr: 'براوني شوكولاتة', description: 'Warm fudge brownie with ice cream', descriptionAr: 'براوني دافئ مع آيس كريم', price: 6.99, category: 'desserts', image: 'https://images.unsplash.com/photo-1564355808539-22d93d889b7f?w=400&h=300&fit=crop', available: true },
      { id: 'de2', name: 'Cheesecake', nameAr: 'تشيز كيك', description: 'New York style cheesecake', descriptionAr: 'تشيز كيك على طريقة نيويورك', price: 5.99, category: 'desserts', image: 'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=400&h=300&fit=crop', available: true },
      { id: 'de3', name: 'Apple Pie', nameAr: 'فطيرة التفاح', description: 'Classic apple pie a la mode', descriptionAr: 'فطيرة تفاح كلاسيك مع آيس كريم', price: 5.49, category: 'desserts', image: 'https://images.unsplash.com/photo-1562007908-17c67e878c88?w=400&h=300&fit=crop', available: true },
      { id: 'de4', name: 'Ice Cream Sundae', nameAr: 'آيس كريم ساندي', description: 'Three scoops with toppings', descriptionAr: 'ثلاث كرات مع الإضافات', price: 4.99, category: 'desserts', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop', available: true },
    ]
  }
];

export function findMenuItem(query: string): MenuItem | null {
  const lower = query.toLowerCase().trim();
  for (const category of menuCategories) {
    for (const item of category.items) {
      if (item.name.toLowerCase().includes(lower) || item.nameAr.includes(lower) || item.id === lower) {
        return item;
      }
    }
  }
  return null;
}

export function calculateOrderTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
}

export function formatPrice(price: number, lang: 'ar' | 'en' = 'ar'): string {
  return lang === 'ar' ? `${price.toFixed(2)} ر.س` : `${price.toFixed(2)} SAR`;
}
