import type { McpContext, McpToolResult } from '../types';

type TravelTopic = 'weather' | 'visa' | 'safety' | 'transport' | 'food_guide' | 'currency' | 'emergency';

interface GetTravelInfoInput {
  topic: TravelTopic;
}

const INFO_EN: Record<TravelTopic, string> = {
  weather: [
    'Oman has a hot arid climate with two main seasons.',
    'October to April: Cooler period with temperatures between 20-30 C in the north, ideal for touring.',
    'May to September: Very hot (40-50 C) across most of the country, except Dhofar which enjoys the Khareef monsoon (June-September) with cool rain, mist, and lush greenery.',
    'Jebel Shams and the Hajar Mountains stay cooler year-round (can drop below 10 C in winter).',
    'Humidity is high along the coast, especially in Muscat during summer.',
    'Tip: Always carry water and sun protection. Start outdoor activities early in the morning.',
  ].join('\n\n'),

  visa: [
    'Visa Policy for Oman (as of 2025):',
    'GCC nationals: No visa required.',
    'Visa-free entry (10-14 days): Citizens of select countries including the US, UK, EU, Canada, Australia, Japan, and others.',
    'e-Visa: Available for most nationalities through the Royal Oman Police website (https://evisa.rop.gov.om).',
    'Common e-Visa types: Tourist visa (10 days, ~5 OMR), Tourist visa (30 days, ~20 OMR), Tourist visa (1 year multiple entry, ~50 OMR).',
    'All visitors must hold a passport valid for at least 6 months.',
    'Tip: Apply for your e-Visa at least 1 week before travel. Carry a printed copy.',
  ].join('\n\n'),

  safety: [
    'Oman is one of the safest countries in the Middle East and the world.',
    'Violent crime is extremely rare. Petty theft is uncommon but use normal precautions.',
    'Driving: Roads are well-maintained. A 4WD is needed for wadi and desert routes. Speed limits are strictly enforced by cameras.',
    'Weather hazards: Flash floods in wadis during rain season (avoid camping in wadi beds). Extreme heat in summer.',
    'Cultural respect: Oman is conservative. Dress modestly in public, especially near mosques. Photography of government buildings and military areas is prohibited.',
    'Emergency number: 9999 (Royal Oman Police).',
    'Tip: Download the Oman emergency app and keep a local SIM card for connectivity.',
  ].join('\n\n'),

  transport: [
    'Getting around Oman:',
    'Car rental: The most popular and practical option. International licenses accepted. Drive on the right side.',
    'Major rental companies are at Muscat International Airport. Budget ~15-30 OMR/day.',
    'Fuel: Very affordable (~0.23 OMR/litre for regular petrol). Stations are common in cities but sparse in remote areas.',
    'Taxis: Available in Muscat and major cities. Use official metered taxis or ride-hailing apps.',
    'Buses: Mwasalat operates public buses in Muscat and intercity routes. Affordable but limited schedules.',
    'Domestic flights: Oman Air and SalamAir connect Muscat to Salalah, Duqm, and Khasab.',
    'Tip: For off-road adventures (Wahiba Sands, wadis), hire a 4WD. Let tyre pressure down to 18 PSI for sand driving.',
  ].join('\n\n'),

  food_guide: [
    'Omani cuisine blends Arabian, Indian, and East African influences.',
    'Must-try dishes:',
    '- Shuwa: Slow-roasted lamb marinated in spices, cooked underground for up to 48 hours. Traditionally served on Eid.',
    '- Majboos (Kabsa): Spiced rice with meat or fish, Oman\'s everyday staple.',
    '- Harees: Slow-cooked wheat and meat porridge, comfort food.',
    '- Mashuai: Whole spit-roasted kingfish served with lemon rice. A Muscat speciality.',
    '- Halwa: Dense, sweet confection with saffron, cardamom, and nuts. Served with Omani coffee (kahwa).',
    '- Omani Kahwa: Cardamom-infused coffee served in small cups with dates.',
    'Budget meals: 1.5-3 OMR at local restaurants. Mid-range: 5-10 OMR. Fine dining: 15-30 OMR.',
    'Tip: Visit Mutrah Souq for authentic spices and halwa. Try fresh seafood at the Mutrah fish market.',
  ].join('\n\n'),

  currency: [
    'Currency: Omani Rial (OMR), symbol: ر.ع.',
    '1 OMR = 1,000 baisa. The rial is pegged to the US dollar at 1 OMR = 2.6008 USD.',
    'The Omani Rial is one of the highest-valued currencies in the world.',
    'Common banknotes: 100 baisa, 200 baisa, 500 baisa, 1 OMR, 5 OMR, 10 OMR, 20 OMR, 50 OMR.',
    'ATMs: Widely available in cities. Most accept international cards (Visa, Mastercard).',
    'Credit cards: Accepted at hotels, malls, and restaurants. Cash is preferred at souqs and small shops.',
    'Tipping: Not obligatory but appreciated. 200-500 baisa for small services, 10% at restaurants.',
    'Tip: Carry small cash (500 baisa and 1 OMR notes) for tips, parking, and souq shopping.',
  ].join('\n\n'),

  emergency: [
    'Emergency contacts in Oman:',
    'General emergency (Police): 9999',
    'Ambulance: 9999',
    'Fire department: 9999',
    'Royal Oman Police (non-emergency): +968 2456 0099',
    'Coast Guard: 1555',
    'Tourist Police: +968 2456 3393',
    'Hospitals: Sultan Qaboos University Hospital (Muscat), Khoula Hospital (Muscat), Sultan Qaboos Hospital (Salalah).',
    'Pharmacies: Open 8 AM - 10 PM. Some 24-hour pharmacies in Muscat (Muscat Pharmacy chain).',
    'Embassies are concentrated in the Shatti Al Qurum area of Muscat.',
    'Tip: Save 9999 on speed dial. Keep your hotel address written in Arabic for taxi drivers.',
  ].join('\n\n'),
};

const INFO_AR: Record<TravelTopic, string> = {
  weather: [
    'تتميز عمان بمناخ حار وجاف مع موسمين رئيسيين.',
    'أكتوبر إلى أبريل: فترة أبرد مع درجات حرارة بين 20-30 درجة مئوية في الشمال، مثالية للسياحة.',
    'مايو إلى سبتمبر: حار جدا (40-50 درجة مئوية) في معظم أنحاء البلاد، باستثناء ظفار التي تشهد موسم الخريف (يونيو-سبتمبر) بأمطار باردة وضباب وخضرة خلابة.',
    'جبل شمس وجبال الحجر تبقى أبرد على مدار السنة (يمكن أن تنخفض إلى أقل من 10 درجات مئوية في الشتاء).',
    'الرطوبة عالية على الساحل، خاصة في مسقط خلال الصيف.',
    'نصيحة: احمل دائما الماء والحماية من الشمس. ابدأ الأنشطة الخارجية في الصباح الباكر.',
  ].join('\n\n'),

  visa: [
    'سياسة التأشيرات لعمان (اعتبارا من 2025):',
    'مواطنو دول مجلس التعاون الخليجي: لا يحتاجون تأشيرة.',
    'الدخول بدون تأشيرة (10-14 يوم): مواطنو دول مختارة منها الولايات المتحدة وبريطانيا والاتحاد الأوروبي وكندا وأستراليا واليابان وغيرها.',
    'التأشيرة الإلكترونية: متاحة لمعظم الجنسيات عبر موقع شرطة عمان السلطانية (https://evisa.rop.gov.om).',
    'أنواع التأشيرات الشائعة: سياحية (10 أيام، ~5 ر.ع.)، سياحية (30 يوم، ~20 ر.ع.)، سياحية متعددة الدخول (سنة، ~50 ر.ع.).',
    'يجب أن يكون جواز السفر صالحا لمدة 6 أشهر على الأقل.',
    'نصيحة: قدم طلب التأشيرة الإلكترونية قبل أسبوع على الأقل من السفر. احتفظ بنسخة مطبوعة.',
  ].join('\n\n'),

  safety: [
    'عمان من أكثر الدول أمانا في الشرق الأوسط والعالم.',
    'الجرائم العنيفة نادرة للغاية. السرقة الصغيرة غير شائعة لكن اتخذ الاحتياطات العادية.',
    'القيادة: الطرق جيدة الصيانة. سيارة دفع رباعي ضرورية لمسارات الأودية والصحراء. حدود السرعة مراقبة بالكاميرات.',
    'مخاطر الطقس: فيضانات مفاجئة في الأودية خلال موسم الأمطار (تجنب التخييم في قاع الأودية). حرارة شديدة في الصيف.',
    'الاحترام الثقافي: عمان محافظة. ارتدِ ملابس محتشمة في الأماكن العامة، خاصة قرب المساجد. التصوير ممنوع بالقرب من المباني الحكومية والعسكرية.',
    'رقم الطوارئ: 9999 (شرطة عمان السلطانية).',
    'نصيحة: حمّل تطبيق الطوارئ العماني واحتفظ بشريحة محلية للاتصال.',
  ].join('\n\n'),

  transport: [
    'التنقل في عمان:',
    'تأجير السيارات: الخيار الأكثر شيوعا وعملية. الرخص الدولية مقبولة. القيادة على الجانب الأيمن.',
    'شركات التأجير الكبرى موجودة في مطار مسقط الدولي. الميزانية ~15-30 ر.ع./يوم.',
    'الوقود: بأسعار معقولة جدا (~0.023 ر.ع./لتر للبنزين العادي). المحطات شائعة في المدن لكنها قليلة في المناطق النائية.',
    'سيارات الأجرة: متوفرة في مسقط والمدن الكبرى. استخدم سيارات الأجرة المعتمدة أو تطبيقات النقل.',
    'الحافلات: تشغلها مواصلات في مسقط وخطوط بين المدن. بأسعار معقولة لكن الجداول محدودة.',
    'الرحلات الداخلية: الطيران العماني وطيران السلام يربطان مسقط بصلالة والدقم وخصب.',
    'نصيحة: للمغامرات الصحراوية (رمال الوهيبة، الأودية)، استأجر سيارة دفع رباعي. خفف ضغط الإطارات إلى 18 PSI للقيادة على الرمال.',
  ].join('\n\n'),

  food_guide: [
    'المطبخ العماني يمزج بين النكهات العربية والهندية والأفريقية الشرقية.',
    'أطباق يجب تجربتها:',
    '- الشوا: لحم خروف مشوي ببطء مع التوابل، يطهى تحت الأرض لمدة 48 ساعة. يقدم تقليديا في العيد.',
    '- المجبوس (الكبسة): أرز متبل مع اللحم أو السمك، الطبق اليومي في عمان.',
    '- الهريس: عصيدة القمح واللحم المطبوخة ببطء.',
    '- المشوي: سمك الكنعد المشوي كاملا يقدم مع أرز الليمون. تخصص مسقطي.',
    '- الحلوى العمانية: حلوى كثيفة بالزعفران والهيل والمكسرات. تقدم مع القهوة العمانية.',
    '- القهوة العمانية: قهوة بالهيل تقدم في فناجين صغيرة مع التمر.',
    'وجبات اقتصادية: 1.5-3 ر.ع. في المطاعم المحلية. متوسطة: 5-10 ر.ع. فاخرة: 15-30 ر.ع.',
    'نصيحة: زر سوق مطرح للتوابل الأصيلة والحلوى. جرب المأكولات البحرية الطازجة في سوق السمك.',
  ].join('\n\n'),

  currency: [
    'العملة: الريال العماني (ر.ع.).',
    '1 ريال = 1,000 بيسة. الريال مربوط بالدولار الأمريكي: 1 ر.ع. = 2.6008 دولار.',
    'الريال العماني من أعلى العملات قيمة في العالم.',
    'الأوراق النقدية الشائعة: 100 بيسة، 200 بيسة، 500 بيسة، 1 ر.ع.، 5 ر.ع.، 10 ر.ع.، 20 ر.ع.، 50 ر.ع.',
    'أجهزة الصراف الآلي: متوفرة بكثرة في المدن. معظمها يقبل البطاقات الدولية (فيزا، ماستركارد).',
    'بطاقات الائتمان: مقبولة في الفنادق والمراكز التجارية والمطاعم. النقد مفضل في الأسواق والمحلات الصغيرة.',
    'البقشيش: غير إلزامي لكنه مقدّر. 200-500 بيسة للخدمات الصغيرة، 10% في المطاعم.',
    'نصيحة: احمل نقودا صغيرة (500 بيسة و1 ر.ع.) للبقشيش والمواقف والتسوق في الأسواق.',
  ].join('\n\n'),

  emergency: [
    'أرقام الطوارئ في عمان:',
    'الطوارئ العامة (الشرطة): 9999',
    'الإسعاف: 9999',
    'الدفاع المدني (الحريق): 9999',
    'شرطة عمان السلطانية (غير طارئ): 24560099 968+',
    'خفر السواحل: 1555',
    'الشرطة السياحية: 24563393 968+',
    'المستشفيات: مستشفى جامعة السلطان قابوس (مسقط)، مستشفى خولة (مسقط)، مستشفى السلطان قابوس (صلالة).',
    'الصيدليات: مفتوحة 8 صباحا - 10 مساء. بعض الصيدليات تعمل 24 ساعة في مسقط.',
    'السفارات متمركزة في منطقة شاطئ القرم في مسقط.',
    'نصيحة: احفظ الرقم 9999 في الاتصال السريع. احتفظ بعنوان فندقك مكتوبا بالعربية لسائقي سيارات الأجرة.',
  ].join('\n\n'),
};

export function getTravelInfo(input: Record<string, any>, ctx: McpContext): McpToolResult {
  // Handle unsupported regions
  if (input.topic === '_unsupported_region') {
    const place = input._place ?? '';
    const content = ctx.locale === 'ar'
      ? `عذراً، منطقة "${place}" غير متوفرة حالياً في قاعدة بياناتنا. نحن نغطي حالياً 6 مناطق في عُمان:\n\n• مسقط — العاصمة والمعالم الرئيسية\n• الداخلية — نزوى، جبل الأخضر، بهلاء\n• الشرقية — صور، رمال الوهيبة، وادي بني خالد\n• ظفار — صلالة وموسم الخريف\n• الباطنة — صحار، نخل، وادي شاب\n• الظاهرة — عبري، مقابر بات\n\nسيتم إضافة المزيد من المناطق قريباً! جرب إحدى المناطق المتوفرة.`
      : `Sorry, "${place}" is not yet available in our database. We currently cover 6 regions in Oman:\n\n• Muscat — Capital city and major landmarks\n• Dakhiliya — Nizwa, Jebel Akhdar, Bahla\n• Sharqiya — Sur, Wahiba Sands, Wadi Bani Khalid\n• Dhofar — Salalah and Khareef season\n• Batinah — Sohar, Nakhal, Wadi Shab\n• Dhahira — Ibri, Bat Tombs\n\nMore regions coming soon! Try one of the available regions.`;
    return { info: { content } };
  }

  const infoMap = ctx.locale === 'ar' ? INFO_AR : INFO_EN;
  const content = infoMap[input.topic as TravelTopic];

  if (!content) {
    const fallback = ctx.locale === 'ar'
      ? 'لم أجد معلومات عن هذا الموضوع. جرب: "كيف الطقس؟" أو "معلومات التأشيرة" أو "هل عمان آمنة؟"'
      : 'I don\'t have info on that topic. Try: "How\'s the weather?", "Visa info", or "Is Oman safe?"';
    return { info: { content: fallback } };
  }

  return { info: { content } };
}
