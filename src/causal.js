/**
 * Causal explanation engine, advisor intelligence, and Dörner cognitive trap
 * analyzer for the Lohhausen simulator.
 *
 * Implements the system dynamics mental model from Dietrich Dörner's
 * "Die Logik des Mißlingens" (The Logic of Failure).
 */

const ADVISORS_LIST = [
  {
    id: 'krause',
    sphere: 'factory',
    name: 'Герр Краузе',
    role: 'Директор часовой фабрики',
    icon: 'factory',
    color: '#9c7840',
    title: 'Часовое производство и сбыт',
    evaluate: (game) => getAdvisorDiagnosis('factory', game),
  },
  {
    id: 'weber',
    sphere: 'finance',
    name: 'Фрау Вебер',
    role: 'Казначей города',
    icon: 'coins',
    color: '#345944',
    title: 'Казна, налоги и долговая нагрузка',
    evaluate: (game) => getAdvisorDiagnosis('finance', game),
  },
  {
    id: 'bauer',
    sphere: 'housing',
    name: 'Герр Бауэр',
    role: 'Главный архитектор и жилищный комиссар',
    icon: 'home',
    color: '#718477',
    title: 'Жилой фонд и градостроительство',
    evaluate: (game) => getAdvisorDiagnosis('housing', game),
  },
  {
    id: 'frank',
    sphere: 'social',
    name: 'Доктор Франк',
    role: 'Комиссар по здравоохранению и труду',
    icon: 'people',
    color: '#51765f',
    title: 'Здравоохранение, услуги и образование',
    evaluate: (game) => getAdvisorDiagnosis('social', game),
  },
  {
    id: 'lindemann',
    sphere: 'tourism',
    name: 'Фрау Линдеманн',
    role: 'Управление туризма и развития',
    icon: 'leaf',
    color: '#bc9150',
    title: 'Гостеприимство и рекреация',
    evaluate: (game) => getAdvisorDiagnosis('tourism', game),
  },
];

ADVISORS_LIST.factory = ADVISORS_LIST[0];
ADVISORS_LIST.finance = ADVISORS_LIST[1];
ADVISORS_LIST.housing = ADVISORS_LIST[2];
ADVISORS_LIST.social = ADVISORS_LIST[3];
ADVISORS_LIST.tourism = ADVISORS_LIST[4];

export const ADVISORS = Object.freeze(ADVISORS_LIST);

export const CAUSAL_LOOPS = Object.freeze([
  {
    id: 'tax_loop',
    title: 'Налоговая петля оттока',
    category: 'Финансы и миграция',
    loopType: 'balancing',
    typeLabel: 'Балансирующий контур (B)',
    icon: '⚖️',
    delayNodeIndex: -1,
    summary: 'Налоги ↑ ➔ Доходы казны ↑ сейчас, но Чистый доход ↓ ➔ Благополучие ↓ ➔ Отток населения ➔ Сжатие налоговой базы в будущем.',
    nodes: ['Налоговая ставка', 'Доходы бюджета', 'Располагаемый доход', 'Привлекательность', 'Миграция', 'Налоговая база'],
    explain: 'Повышение налога кажется легким способом закрыть дыру в казне. Однако бремя снижает привлекательность Лоххаузена: жители начинают уезжать, число налогоплательщиков падает, и в итоге налоговые поступления снова снижаются, несмотря на высокую ставку.',
    mechanism: 'Повышение налоговой ставки временно увеличивает сборы, но подрывает располагаемый доход и привлекательность города, вызывая отток населения.',
    dornerLesson: 'Недооценка запаздывающей обратной связи: участники эксперимента Дёрнера часто завышали налоги, не замечая оттока жителей.',
    dornerReference: 'Глава 2, §48: участники часто завышали налоги, не замечая оттока налогоплательщиков.',
  },
  {
    id: 'maintenance_loop',
    title: 'Петля износа станков',
    category: 'Производство',
    loopType: 'reinforcing',
    typeLabel: 'Усиливающий контур износа (R)',
    icon: '🔄',
    delayNodeIndex: 1,
    summary: 'Обслуживание ↓ ➔ Экономия бюджета сейчас, но Износ станков ↑ ➔ Брак и падение выпуска ➔ Спад продаж ➔ Убыток фабрики.',
    nodes: ['Расходы на ремонт', 'Состояние станков', 'Производительность', 'Выпуск часов', 'Выручка и прибыль'],
    explain: 'Экономия на текущем обслуживании станков не дает немедленного провала в первый же месяц. Но износ накапливается: станки ломаются, растет брак, выпуск падает, фабрика перестает приносить прибыль и начинает тянуть деньги из казны.',
    mechanism: 'Снижение расходов на обслуживание запускает кумулятивный износ оборудования, ведущий к обвалу выпуска и убыткам.',
    dornerLesson: 'Системное непонимание скрытого износа: участники списывали падение выпуска на внешние факторы, игнорируя деградацию фондов.',
    dornerReference: 'Глава 7, §85: участник объяснял падение выпуска леностью рабочих, хотя причиной был износ оборудования.',
  },
  {
    id: 'housing_lag_loop',
    title: 'Петля привлекательности и задержки жилья',
    category: 'Жилье и социум',
    loopType: 'balancing',
    typeLabel: 'Запаздывающий контур с лагом (B)',
    icon: '⏳',
    delayNodeIndex: 3,
    summary: 'Успех города ➔ Приток жителей ➔ Исчерпание жилья (лаг стройки 12 мес.) ➔ Дефицит мест ➔ Перегрузка услуг ➔ Спад благополучия.',
    nodes: ['Благополучие города', 'Приток мигрантов', 'Потребность в жилье', 'Строительство (лаг 12 мес.)', 'Дефицит мест', 'Спад удовлетворенности'],
    explain: 'Если сделать город привлекательным, люди начинают приезжать. Но строительство муниципального жилья длится 12 месяцев. Если не начать строить заранее, город сталкивается с дефицитом жилья и перегрузкой больниц, что разрушает достигнутое благополучие.',
    mechanism: 'Временной лаг возведения жилья (12 месяцев) порождает кризис дефицита при резком притоке новых жителей.',
    dornerLesson: 'Игнорирование временных лагов (time lags) — одна из главных причин паники и нетерпеливого перерегулирования.',
    dornerReference: 'Глава 6, §54: ошибки в учете временных задержек (time lags) — одна из главных причин управленческого краха.',
  },
  {
    id: 'debt_spiral',
    title: 'Долговая спираль',
    category: 'Финансы',
    loopType: 'reinforcing',
    typeLabel: 'Усиливающая долговая спираль (R)',
    icon: '🔄',
    delayNodeIndex: -1,
    summary: 'Дефицит ➔ Займы ➔ Рост долга ➔ Проценты по долгу (+0.8%/мес.) ➔ Еще больший дефицит в следующем месяце.',
    nodes: ['Операционный дефицит', 'Займы города', 'Накопленный долг', 'Процентные выплаты', 'Неизбежные расходы'],
    explain: 'Покрытие текущих расходов займами порождает обязательства по процентам. При ставке 0.8% в месяц долг в 5000 тыс. требует 40 тыс. только на выплату процентов каждый месяц, оставляя всё меньше денег на школы и ремонт.',
    mechanism: 'Экспоненциальное накопление процентных обязательств при систематическом бюджетном дефиците.',
    dornerLesson: 'Кредитная эйфория: участники покрывали операционные провалы займами, не просчитывая лавинообразный рост процентов.',
    dornerReference: 'Глава 1, §5–12: пример Моро — стремление заткнуть текущие дыры приводит к истощению всех ресурсов.',
  },
  {
    id: 'tourism_bottleneck',
    title: 'Бутылочное горлышко туризма',
    category: 'Экономика',
    loopType: 'balancing',
    typeLabel: 'Ограничивающий контур емкости (B)',
    icon: '⚖️',
    delayNodeIndex: 2,
    summary: 'Реклама туризма ↑ ➔ Внешний спрос ↑, но если нет Гостиниц или Работников ➔ Туристы не приедут, деньги на рекламу сгорели.',
    nodes: ['Реклама туризма', 'Туристический спрос', 'Вместимость гостиниц', 'Свободная рабочая сила', 'Реальные посетители'],
    explain: 'Реклама привлекает желающих приехать, но туризм жестко ограничен материальными ресурсами: числом спальных мест в городе и наличием свободных работников. Если мест всего 20, реклама на 50 тыс. просто сгорает впустую.',
    mechanism: 'Физическая пропускная способность номерного фонда ограничивает отдачу от маркетинговых расходов.',
    dornerLesson: '«Рекламный мираж»: иллюзия, что маркетингом можно решить проблему при отсутствии физической емкости.',
    dornerReference: 'Глава 5, §13–17: участники спускали огромные бюджеты на рекламу туризма в городе, где негде было переночевать.',
  },
]);

/**
 * Generates an intelligent, qualitative memo from the advisor of a specific sphere.
 */
export function getAdvisorDiagnosis(sphereId, game) {
  const p = game.policies || {};
  const budget = game.lastBudget || {};
  const month = game.month;

  switch (sphereId) {
    case 'factory': {
      const eq = game.equipment;
      const inv = game.inventory;
      const dem = game.demand;
      const profit = budget.factoryProfit ?? (game.sales * 0.57 - game.factoryJobs * 0.105 * (p.wage / 100) - game.production * 0.145 - p.maintenance - p.marketing);

      if (eq < 25) {
        return {
          status: 'crisis',
          tone: 'danger',
          quote: '«Господин бургомистр, станки полностью разбиты! Износ критический. Рабочие простаивают, выпуска едва хватает, фабрика несет убытки. Срочно нужен ремонт или капитальная модернизация!»',
          keyStat: `Станки: ${eq.toFixed(1)}% (Критический износ)`,
          recommendation: 'Увеличьте обслуживание станков минимум до 25–35 тыс./мес. или начните модернизацию.',
        };
      }
      if (eq < 45) {
        return {
          status: 'warning',
          tone: 'warning',
          quote: '«Станки заметно изношены. Текущего ремонта не хватает, чтобы перекрыть естественный износ. Если не вложиться в обслуживание, производительность продолжит падать».',
          keyStat: `Станки: ${eq.toFixed(1)}% (Ниже нормы)`,
          recommendation: 'Для восстановления оборудования расходы на обслуживание должны быть не ниже 18–22 тыс./мес.',
        };
      }
      if (inv > dem * 1.6 && inv > 200) {
        return {
          status: 'warning',
          tone: 'warning',
          quote: `«Наши склады забиты: скопилось ${Math.round(inv)} часов при месячном спросе ${Math.round(dem)} шт. Мы производим часы «на склад», замораживая средства фабрики».`,
          keyStat: `Запасы на складе: ${Math.round(inv)} шт.`,
          recommendation: 'Увеличьте маркетинг часов для расширения сбыта или временно снизьте выпуск.',
        };
      }
      if (profit < -20) {
        return {
          status: 'warning',
          tone: 'warning',
          quote: `«Фабрика в этом месяце сработала в убыток (${Math.round(profit)} тыс. м.). Выручка не покрывает зарплаты, материалы и ремонт. Фабрика тянет средства из городской казны».`,
          keyStat: `Сальдо фабрики: ${profit > 0 ? '+' : ''}${Math.round(profit)} тыс. м.`,
          recommendation: 'Проверьте ставку оплаты труда и сбалансируйте маркетинг со спросом.',
        };
      }
      if (eq >= 70) {
        return {
          status: 'good',
          tone: 'positive',
          quote: '«Оборудование в прекрасном состоянии! Выпуск часов стабилен, квалификация рабочих позволяет держать высокое качество. Фабрика работает как надежные швейцарские часы».',
          keyStat: `Станки: ${eq.toFixed(1)}% · Выпуск: ${Math.round(game.production)} шт.`,
          recommendation: 'Поддерживайте текущий уровень обслуживания (около 14–16 тыс./мес.).',
        };
      }
      return {
        status: 'normal',
        tone: 'neutral',
        quote: '«Фабрика работает стабильно. Станки требуют регулярного внимания, запасы на складе соответствуют обычному месячному обороту».',
        keyStat: `Станки: ${eq.toFixed(1)}% · Выпуск: ${Math.round(game.production)} шт.`,
        recommendation: 'Следите за балансом между объемом выпуска и внешним спросом на часы.',
      };
    }

    case 'finance': {
      const debt = game.debt;
      const treasury = game.treasury;
      const net = budget.net || 0;
      const netPosition = treasury - debt;
      const tax = p.taxRate;

      if (debt > 5000) {
        return {
          status: 'crisis',
          tone: 'danger',
          quote: `«Господин бургомистр, город на грани финансового краха! Накоплен долг ${Math.round(debt)} тыс. марок. Каждый месяц мы отдаем банку ${Math.round(budget.interest || debt * 0.008)} тыс. только в виде процентов!»`,
          keyStat: `Долг: ${Math.round(debt)} тыс. м. (Проценты: ${Math.round(budget.interest || debt * 0.008)}/мес.)`,
          recommendation: 'Срочно сокращайте неприоритетные расходы и восстанавливайте доходы фабрики.',
        };
      }
      if (debt > 1200) {
        return {
          status: 'warning',
          tone: 'warning',
          quote: `«Город живет взаймы. Накоплен долг ${Math.round(debt)} тыс. м. При дефиците он продолжит расти, увеличивая будущие процентные выплаты».`,
          keyStat: `Долг: ${Math.round(debt)} тыс. м. · Баланс: ${net > 0 ? '+' : ''}${Math.round(net)} тыс.`,
          recommendation: 'Постарайтесь выйти на ежемесячный профицит, чтобы начать погашение тела кредита.',
        };
      }
      if (net < -45) {
        return {
          status: 'warning',
          tone: 'warning',
          quote: `«В бюджете серьезная дыра: дефицит ${Math.round(net)} тыс. марок в месяц. Свободная казна тает на глазах, скоро придется брать кредиты».`,
          keyStat: `Дефицит: ${Math.round(net)} тыс. м./мес.`,
          recommendation: 'Проанализируйте статьи расходов: услуги, обучение и субсидии.',
        };
      }
      if (tax > 28) {
        return {
          status: 'warning',
          tone: 'warning',
          quote: `«Налоговая ставка (${tax}%) слишком высока. В казну сейчас поступает больше, но жители возмущены падением чистого дохода. Мы рискуем спровоцировать массовый отток населения».`,
          keyStat: `Налог: ${tax}% (Опасная зона)`,
          recommendation: 'Снизьте ставку налога до 18–22%, пока не начался отъезд налогоплательщиков.',
        };
      }
      if (netPosition > 1500 && debt === 0) {
        return {
          status: 'good',
          tone: 'positive',
          quote: `«Превосходная финансовая форма! Казна полна (${Math.round(treasury)} тыс. м.), долгов нет, баланс положительный. У нас есть ресурсы для инвестиций в жилье или фабрику».`,
          keyStat: `Казна: ${Math.round(treasury)} тыс. м. (Долг: 0)`,
          recommendation: 'Рассмотрите запуск капитальных проектов: жилья или модернизации фабрики.',
        };
      }
      return {
        status: 'normal',
        tone: 'neutral',
        quote: `«Бюджет находится в рабочем состоянии. Казна: ${Math.round(treasury)} тыс. м., долг: ${Math.round(debt)} тыс. м. Текущий баланс месяца: ${net > 0 ? '+' : ''}${Math.round(net)} тыс.».`,
        keyStat: `Баланс: ${net > 0 ? '+' : ''}${Math.round(net)} тыс. м./мес.`,
        recommendation: 'Контролируйте, чтобы обязательные расходы не превышали налоговые поступления и прибыль.',
      };
    }

    case 'housing': {
      const pop = game.population;
      const cap = game.housingCapacity;
      const shortage = game.housingShortage;
      const free = Math.max(0, cap - pop);
      const activeHousing = (game.projects || []).find((pr) => pr.type === 'housing');

      if (shortage > 0) {
        return {
          status: 'crisis',
          tone: 'danger',
          quote: `«Острый жилищный кризис! В городе не хватает ${Math.round(shortage)} мест жилья. Семьи ютятся в стесненных условиях, растет недовольство, привлекательность города падает».`,
          keyStat: `Дефицит жилья: ${Math.round(shortage)} мест`,
          recommendation: activeHousing
            ? `Идет стройка (ввод через ${Math.max(1, activeHousing.completeMonth - month)} мес.). Дождитесь ввода!`
            : 'Срочно запустите проект муниципального жилья (300 тыс. м., срок 12 мес., +60 мест).',
        };
      }
      if (free < 40) {
        return {
          status: 'warning',
          tone: 'warning',
          quote: `«Свободного жилья почти не осталось — всего ${Math.round(free)} мест. Если город продолжит привлекать людей, через 2–3 месяца начнется дефицит. А новое жилье строится 12 месяцев!»`,
          keyStat: `Свободно всего: ${Math.round(free)} мест`,
          recommendation: activeHousing
            ? `Стройка уже идет (ввод в месяце ${activeHousing.completeMonth}).`
            : 'Запустите строительство жилья сейчас, чтобы опередить будущий дефицит.',
        };
      }
      if (activeHousing) {
        const left = Math.max(1, activeHousing.completeMonth - month);
        return {
          status: 'normal',
          tone: 'neutral',
          quote: `«Строительство муниципального квартала идет полным ходом. Срок ввода — месяц ${activeHousing.completeMonth} (осталось ${left} мес.). Новые 60 мест скоро поступят горожанам».`,
          keyStat: `Стройка: осталось ${left} мес. · Резерв: ${Math.round(free)} мест`,
          recommendation: 'Не паникуйте и не дублируйте стройку без острой нужды — дождитесь завершения.',
        };
      }
      return {
        status: 'good',
        tone: 'positive',
        quote: `«Жилищный фонд в порядке: вместимость ${Math.round(cap)} мест на ${Math.round(pop)} жителей. В запасе ${Math.round(free)} свободных мест. Город готов к приему новых семей».`,
        keyStat: `Вместимость: ${Math.round(cap)} · Свободно: ${Math.round(free)} мест`,
        recommendation: 'Отслеживайте миграционный приток: если он усилится, запланируйте стройку заранее.',
      };
    }

    case 'social': {
      const sat = game.satisfaction;
      const groups = game.satisfactionGroups || {};
      const unemp = game.unemployment;
      const health = game.health;
      const qual = game.serviceQuality;
      const edu = game.education;

      const lowestGroup = Object.entries(groups).sort((a, b) => a[1] - b[1])[0];

      if (sat < 65) {
        return {
          status: 'crisis',
          tone: 'danger',
          quote: `«Жители крайне недовольны условиями жизни (индекс ${Math.round(sat)}/100). Наибольшее напряжение среди ${groupLabel(lowestGroup?.[0])} (${Math.round(lowestGroup?.[1] || 0)} п.). Люди голосуют ногами и уезжают!»`,
          keyStat: `Благополучие: ${Math.round(sat)}/100 (Критически низкое)`,
          recommendation: 'Поднимите расходы на общественные услуги и медицину, проверьте зарплаты и дефицит жилья.',
        };
      }
      if (unemp > game.workforce * 0.15 && game.workforce > 0) {
        return {
          status: 'warning',
          tone: 'warning',
          quote: `«Растет безработица: ${Math.round(unemp)} человек без работы (${Math.round((unemp / game.workforce) * 100)}% рабочей силы). Безработица бьет по доходам семей и общему спокойствию».`,
          keyStat: `Без работы: ${Math.round(unemp)} чел.`,
          recommendation: 'Создайте новые рабочие места на фабрике (через спрос/маркетинг) или в сфере туризма.',
        };
      }
      if (health < 50 || qual < 50) {
        return {
          status: 'warning',
          tone: 'warning',
          quote: `«Социальные службы истощены. Здоровье жителей (${Math.round(health)}/100) или качество услуг (${Math.round(qual)}/100) просели из-за недостаточного финансирования».`,
          keyStat: `Услуги: ${Math.round(qual)}/100 · Здоровье: ${Math.round(health)}/100`,
          recommendation: 'Увеличьте ежемесячный бюджет общественных услуг (норма около 65–75 тыс. м.).',
        };
      }
      return {
        status: 'good',
        tone: 'positive',
        quote: `«Социальный климат благоприятный: благополучие ${Math.round(sat)}/100. Рабочие довольны условиями (${Math.round(groups.workers || sat)}), семьи чувствуют заботу (${Math.round(groups.families || sat)}), пожилые спокойны (${Math.round(groups.seniors || sat)})».`,
        keyStat: `Благополучие: ${Math.round(sat)}/100 · Безработица: ${Math.round(unemp)} чел.`,
        recommendation: 'Поддерживайте расходы на обучение для планомерного роста квалификации рабочих.',
      };
    }

    case 'tourism': {
      const cap = game.tourismCapacity;
      const dem = game.tourismDemand;
      const visitors = game.visitors;
      const jobs = game.tourismJobs;
      const ads = p.tourismMarketing;

      if (ads > 20 && cap < 50) {
        return {
          status: 'warning',
          tone: 'warning',
          quote: `«Внимание, господин бургомистр! Мы тратим ${ads} тыс. на рекламу, спрос вырос до ${Math.round(dem)} человек, но в городе всего ${cap} гостиничных мест! Большинство желающих просто негде разместить — деньги на рекламу тратятся впустую».`,
          keyStat: `Спрос: ${Math.round(dem)} при вместимости ${cap} мест`,
          recommendation: 'Запустите проект «Туристическая инфраструктура» (+80 мест) или снизьте рекламу до расширения отелей.',
        };
      }
      if (visitors >= cap && cap >= 100) {
        return {
          status: 'good',
          tone: 'positive',
          quote: `«Гостиницы заполнены на 100%! Мы приняли ${Math.round(visitors)} туристов, это дает казне ${Math.round(visitors * 0.19)} тыс. чистыми и обеспечивает занятость ${jobs} горожан».`,
          keyStat: `Туристов: ${Math.round(visitors)} · Доход: +${Math.round(visitors * 0.19)} тыс. м.`,
          recommendation: 'Отличный сектор диверсификации. Поддерживайте умеренную рекламу (10–15 тыс./мес.).',
        };
      }
      return {
        status: 'normal',
        tone: 'neutral',
        quote: `«Туристический сектор работает в спокойном режиме: вместимость ${cap} мест, принято ${Math.round(visitors)} гостей. Спрос составляет ${Math.round(dem)} чел.».`,
        keyStat: `Мест: ${cap} · Посетителей: ${Math.round(visitors)}`,
        recommendation: 'Развитие туризма требует синхронного роста гостиниц, рекламы и доступных рабочих рук.',
      };
    }

    default:
      return { status: 'normal', tone: 'neutral', quote: 'Служба готова к исполнению поручений.', keyStat: '', recommendation: '' };
  }
}

function groupLabel(key) {
  switch (key) {
    case 'workers': return 'рабочих';
    case 'families': return 'семей с детьми';
    case 'seniors': return 'пожилых жителей';
    default: return 'жителей';
  }
}

/**
 * Detailed causal breakdown of the transition between two months.
 * Tells the player EXACTLY what changed, why, and what mechanisms were at work.
 */
export function explainStepCauses(current, previous) {
  if (!previous || previous.month === current.month) {
    return [
      {
        sphere: 'overview',
        icon: 'clock',
        headline: 'Начало управления городом',
        explanation: 'Лоххаузен ожидает первых решений. Ознакомьтесь с докладами подразделений и определите приоритеты.',
        tone: 'neutral',
      },
    ];
  }

  const p = current.policies || {};
  const prevPolicies = previous.policies || p;
  const items = [];

  // 0. Completed Projects & Temporal Hypothesis Reflection
  const completions = (current.journal || []).filter(j =>
    j.type === 'completion' && j.month > previous.month && j.month <= current.month
  );
  for (const comp of completions) {
    const projTitle = comp.title ? comp.title.replace(/^Завершён проект:\s*/, '') : 'Инвестиционный проект';
    const origProj = (current.journal || []).find(j =>
      j.type === 'project' && j.project && (comp.title.includes(j.project.label) || j.project.label.includes(projTitle))
    );
    const origNote = origProj?.note ? origProj.note.trim() : '';
    const noteMsg = origNote ? ` Изначальная гипотеза бургомистра: «${origNote}».` : ' Проект реализовывался без предварительной формулировки гипотезы.';
    items.push({
      sphere: 'project',
      icon: 'spark',
      headline: `🏗️ Завершен проект: ${projTitle}`,
      explanation: `Временной лаг стройки завершен, мощности введены в эксплуатацию.${noteMsg} Сверьте реальные сдвиги показателей с вашими ожиданиями.`,
      tone: 'positive',
    });
  }

  // 1. Factory & Production Causal Flow
  const deltaEq = current.equipment - previous.equipment;
  const deltaProd = current.production - previous.production;
  const deltaInv = current.inventory - previous.inventory;

  let factoryExplain = '';
  if (deltaEq > 0.5) {
    factoryExplain = `Обслуживание (${p.maintenance} тыс. м.) превысило износ: станки восстановились на +${deltaEq.toFixed(1)}%.`;
  } else if (deltaEq < -0.5) {
    factoryExplain = `Расходов на обслуживание (${p.maintenance} тыс. м.) не хватило против естественного износа и нагрузки: станки износились на ${deltaEq.toFixed(1)}%.`;
  } else {
    factoryExplain = `Текущее обслуживание (${p.maintenance} тыс. м.) компенсирует естественный износ станков.`;
  }

  if (current.sales < current.production) {
    factoryExplain += ` Произведено ${Math.round(current.production)} часов, продано ${Math.round(current.sales)}. Остаток ${Math.round(current.production - current.sales)} шт. ушел на склад (всего на складе ${Math.round(current.inventory)}).`;
  } else if (current.inventory < previous.inventory) {
    factoryExplain += ` Высокий спрос (${Math.round(current.demand)} шт.) позволил продать всю партию и разгрузить склад на ${Math.round(previous.inventory - current.inventory)} шт.`;
  }

  items.push({
    sphere: 'factory',
    icon: 'factory',
    headline: `Фабрика: выпуск ${Math.round(current.production)} шт. (${deltaProd >= 0 ? '+' : ''}${Math.round(deltaProd)})`,
    explanation: factoryExplain,
    tone: deltaEq < -1 || current.equipment < 30 ? 'warning' : deltaEq > 0.5 ? 'positive' : 'neutral',
  });

  // 2. Budget & Treasury Causal Flow
  const budget = current.lastBudget || {};
  const net = budget.net || 0;
  const debtDelta = current.debt - previous.debt;
  const treasuryDelta = current.treasury - previous.treasury;

  let budgetExplain = '';
  if (net < 0) {
    const shortage = -net;
    if (debtDelta > 0) {
      budgetExplain = `Дефицит бюджета составил ${Math.round(shortage)} тыс. марок. Казны не хватило, долг города вырос на +${Math.round(debtDelta)} тыс. м. (на проценты уже уходит ${Math.round(budget.interest || 0)} тыс./мес.).`;
    } else {
      budgetExplain = `Дефицит в ${Math.round(shortage)} тыс. марок полностью покрыт из свободной казны (осталось ${Math.round(current.treasury)} тыс. м.).`;
    }
  } else {
    if (previous.debt > 0 && current.debt < previous.debt) {
      budgetExplain = `Профицит в ${Math.round(net)} тыс. марок позволил погасить ${Math.round(previous.debt - current.debt)} тыс. городского долга.`;
    } else {
      budgetExplain = `Профицит в +${Math.round(net)} тыс. марок пополнил городскую казну (всего свободных средств: ${Math.round(current.treasury)} тыс. м.).`;
    }
  }

  items.push({
    sphere: 'finance',
    icon: 'coins',
    headline: `Бюджет: сальдо ${net >= 0 ? '+' : ''}${Math.round(net)} тыс. м. (${net >= 0 ? 'профицит' : 'дефицит'})`,
    explanation: budgetExplain,
    tone: net < -30 || current.debt > 2000 ? 'warning' : net > 0 ? 'positive' : 'neutral',
  });

  // 3. Demographics & Housing Causal Flow
  const deltaPop = current.population - previous.population;
  const shortageDelta = current.housingShortage - previous.housingShortage;

  let demoExplain = '';
  if (deltaPop > 1) {
    demoExplain = `Благополучие города (${Math.round(current.satisfaction)}/100) привлекло +${Math.round(deltaPop)} новых жителей.`;
    if (current.housingShortage > 0) {
      demoExplain += ` Это вызвало дефицит жилья: не хватает ${Math.round(current.housingShortage)} мест.`;
    } else {
      demoExplain += ` В городе осталось ${Math.round(current.housingCapacity - current.population)} свободных мест жилья.`;
    }
  } else if (deltaPop < -1) {
    const reasons = [];
    if (p.taxRate > 22) reasons.push(`высоких налогов (${p.taxRate}%)`);
    if (current.housingShortage > 0) reasons.push('нехватки жилья');
    if (current.satisfaction < 75) reasons.push('падения благополучия');
    demoExplain = `Население сократилось на ${Math.abs(Math.round(deltaPop))} чел. Из-за ${reasons.length ? reasons.join(' и ') : 'условий жизни'} люди покидают Лоххаузен.`;
  } else {
    demoExplain = 'Миграционный баланс стабилен, оттока и резкого притока населения не зафиксировано.';
  }

  items.push({
    sphere: 'housing',
    icon: 'home',
    headline: `Городская среда: население ${Math.round(current.population)} чел. (${deltaPop >= 0 ? '+' : ''}${Math.round(deltaPop)})`,
    explanation: demoExplain,
    tone: current.housingShortage > 0 ? 'danger' : deltaPop < -5 ? 'warning' : 'neutral',
  });

  // 4. Social & Well-being
  const deltaSat = current.satisfaction - previous.satisfaction;
  if (Math.abs(deltaSat) >= 0.5) {
    items.push({
      sphere: 'social',
      icon: 'people',
      headline: `Благополучие жителей: ${Math.round(current.satisfaction)}/100 (${deltaSat >= 0 ? '+' : ''}${deltaSat.toFixed(1)} п.)`,
      explanation: deltaSat > 0
        ? 'Улучшение условий труда, стабильная занятость и финансирование услуг подняли общий социальный настрой.'
        : 'Снижение вызвано нагрузкой на сферу услуг, налогами или нехваткой доступного жилья.',
      tone: deltaSat > 0 ? 'positive' : 'warning',
    });
  }

  return items;
}

/**
 * Analyzes the player's current run and flags classic Dörner cognitive traps.
 */
export function detectCognitiveTraps(game) {
  const traps = [];
  const p = game.policies || {};
  const budget = game.lastBudget || {};
  const history = game.history || [];
  const month = game.month;

  // 1. Repair-service mentality (Reparaturdienst-Verhalten)
  // Sudden huge surge in a specific spending category while running steep deficit
  if (budget.net < -40) {
    const singleDominant = p.services > 110 || p.education > 70 || p.marketing > 60 || p.maintenance > 50;
    if (singleDominant) {
      traps.push({
        id: 'repair_service',
        title: 'Ловушка «Синдром ремонтника»',
        subtitle: 'Reparaturdienst-Mentalität по Дёрнеру',
        message: 'Вы резко увеличили финансирование одной отдельной сферы, но город получил тяжелый дефицит бюджета. В сложных системах нельзя «чинить» один симптом ценой разорения всего механизма.',
        advice: 'Сбалансируйте расходы по всем направлениям вместо максимального вливания в одну точку.',
      });
    }
  }

  // 2. Oversteering & Delay Panic
  // Starting another costly project while a previous one of same type is still in construction
  const activeHousing = (game.projects || []).filter((pr) => pr.type === 'housing');
  if (activeHousing.length > 1) {
    traps.push({
      id: 'delay_panic',
      title: 'Ловушка «Нетерпеливое перерегулирование»',
      subtitle: 'Недооценка временного лага стройки',
      message: 'Запущено сразу несколько параллельных строек жилья. Каждая требует 300 тыс. м. и длится 12 месяцев. Не дождавшись ввода первого объекта, легко опустошить казну и перегрузить город.',
      advice: 'Учитывайте временные задержки (time lags): дайте запущенным проектам завершиться перед новым раундом строек.',
    });
  }

  // 3. Debt Spiral Compounding
  if (game.debt > 3000 && budget.net < 0) {
    traps.push({
      id: 'debt_compounding',
      title: 'Ловушка «Долговой маховик»',
      subtitle: 'Экспоненциальный рост обязательств',
      message: `Город накопил долг ${Math.round(game.debt)} тыс. м. и продолжает жить в дефицит. Выплаты по процентам (${Math.round(budget.interest || 0)} тыс./мес.) превышают многие полезные статьи расходов.`,
      advice: 'Если не выйти в профицит, проценты полностью парализуют муниципальный бюджет.',
    });
  }

  // 4. Tourism Mirage (Advertising without infrastructure)
  if (p.tourismMarketing > 25 && game.tourismCapacity < 50) {
    traps.push({
      id: 'tourism_mirage',
      title: 'Ловушка «Рекламный мираж»',
      subtitle: 'Разрыв между спросом и физической емкостью',
      message: `Вы тратите ${p.tourismMarketing} тыс. м. на рекламу туризма, но в городе всего ${game.tourismCapacity} гостиничных мест. Желающие приехать упираются в нехватку отелей, и деньги на рекламу сгорают.`,
      advice: 'Сначала постройте туристическую инфраструктуру (+80 мест), и только затем наращивайте рекламу.',
    });
  }

  // 5. Tax Kill (Ignoring long-term side effects)
  if (p.taxRate >= 28 && game.migrationPressure < -2) {
    traps.push({
      id: 'tax_kill',
      title: 'Ловушка «Побочный налоговый эффект»',
      subtitle: 'Разрушение налоговой базы ради сиюминутных поступлений',
      message: `Налоговая ставка ${p.taxRate}% дает временную прибавку в казне, но провоцирует отток жителей и квалифицированных рабочих. Через год налоговая база сожмется.`,
      advice: 'Снизьте налоговое давление, чтобы сохранить привлекательность города.',
    });
  }

  return traps;
}

/**
 * Provides an instant "What-If" preview when adjusting a policy slider.
 */
export function getPolicyWhatIf(key, value, game) {
  const num = Number(value);
  const pop = game.population || 3700;
  const workforce = game.workforce || Math.round(pop * 0.555);

  switch (key) {
    case 'taxRate': {
      const approxIncome = Math.round(workforce * 0.1 * (num / 100) * 10) / 10;
      let side = 'Умеренное влияние на располагаемый доход.';
      let risk = 'Низкий риск оттока.';
      if (num > 24) {
        side = 'Заметно снижает привлекательность города для специалистов и рабочих.';
        risk = 'Высокий риск миграционного оттока через 3–6 месяцев.';
      } else if (num < 10) {
        side = 'Оставляет максимум средств жителям, высокая привлекательность города.';
        risk = 'Хронический недобор средств в городскую казну.';
      }
      return {
        direct: `Около +${Math.round(workforce * 0.09 * (num / 100))} тыс. м./мес. налоговых поступлений.`,
        sideEffect: side,
        risk: risk,
      };
    }
    case 'maintenance': {
      let direct = '';
      let side = '';
      let risk = '';
      if (num < 14) {
        direct = `Экономия казны, но станки будут деградировать (естественный износ превышает ремонт).`;
        side = 'Падение производительности труда и качества часов.';
        risk = 'Через 4–8 месяцев выпуск резко упадет, фабрика станет убыточной.';
      } else if (num <= 22) {
        direct = 'Оптимальный уровень: компенсирует износ оборудования и стабилизирует станки.';
        side = 'Равномерный темп выпуска без простоев.';
        risk = 'Нет.';
      } else {
        direct = 'Интенсивное восстановление станков до 100% состояния.';
        side = 'Повышенные ежемесячные затраты фабрики.';
        risk = 'После достижения 100% станки не станут работать лучше нормы — расходы можно будет снизить.';
      }
      return { direct, sideEffect: side, risk };
    }
    case 'wage': {
      return {
        direct: `Фонд оплаты труда фабрики изменится пропорционально ставке (${num}%).`,
        sideEffect: num >= 100
          ? 'Повышает удовлетворенность рабочих фабрики и привлекает кадры.'
          : 'Снижает удовлетворенность рабочих, риск дефицита рабочих рук.',
        risk: num > 125
          ? 'Фабрика может стать планово-убыточной.'
          : num < 80
            ? 'Резкое недовольство рабочего класса.'
            : 'Умеренный риск.',
      };
    }
    case 'services': {
      const need = pop * 0.0205;
      return {
        direct: `Ежемесячные расходы казны: ${num} тыс. марок (потребность города: ~${Math.round(need)} тыс.).`,
        sideEffect: num >= need
          ? 'Поддерживает высокое качество здравоохранения и услуг, защищает пожилых и семьи.'
          : 'Постепенное ухудшение здоровья жителей и отток населения.',
        risk: num > need * 1.4 ? 'Чрезмерная нагрузка на казну без дополнительной отдачи (насыщение).' : 'Риск деградации социальной среды.',
      };
    }
    case 'education': {
      return {
        direct: `Ежемесячные вложения: ${num} тыс. марок.`,
        sideEffect: 'С задержкой в несколько месяцев повышает квалификацию рабочих и производительность.',
        risk: 'Эффект проявляется медленно (инерция системы), не ждите мгновенной отдачи через месяц.',
      };
    }
    case 'marketing': {
      return {
        direct: `Расходы на сбыт: ${num} тыс. м./мес. Расширяет спрос на ~${Math.round(num * 5.2)} часов/мес.`,
        sideEffect: 'Помогает разгружать склады и увеличивает продажи.',
        risk: 'Если фабрика не способна выпустить столько часов из-за станков, спрос останется нереализованным.',
      };
    }
    case 'tourismMarketing': {
      return {
        direct: `Расходы на рекламу туризма: ${num} тыс. м./мес.`,
        sideEffect: `Привлекает туристов (текущая вместимость отелей: ${game.tourismCapacity} мест).`,
        risk: num > 15 && game.tourismCapacity < 60
          ? 'Деньги тратятся впустую: в городе нет свободных гостиниц для всех привлеченных туристов!'
          : 'Нет существенных рисков.',
      };
    }
    default:
      return { direct: 'Изменение действующей политики.', sideEffect: 'Вступит в силу со следующего месяца.', risk: 'Нет.' };
  }
}
