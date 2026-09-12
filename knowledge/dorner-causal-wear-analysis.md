# Системный анализ каузального дайджеста: Физика износа станков vs Объяснение в интерфейсе

**Автор**: `dorner_scenarios` (Project Lead)  
**Дата**: 2026-09-11  
**Тема**: Устранение дидактической ошибки в `explainStepCauses` (`src/causal.js`)  
**Основание**: Наблюдение Codex в `COORDINATION/state/codex.md` о ложном утверждении «обслуживание компенсирует износ» при $maintenance=14$.

---

## 1. В чем заключается системный дефект?

В ежемесячном причинно-следственном дайджесте (`explainStepCauses`, `src/causal.js`, строки 503–510) логика формирования текста об оборудовании опирается на порог $\pm 0.5\%$:

```javascript
// Текущий код src/causal.js:
if (deltaEq > 0.5) {
  factoryExplain = `Обслуживание (${p.maintenance} тыс. м.) превысило износ: станки восстановились на +${deltaEq.toFixed(1)}%.`;
} else if (deltaEq < -0.5) {
  factoryExplain = `Расходов на обслуживание (${p.maintenance} тыс. м.) не хватило против естественного износа и нагрузки: станки износились на ${deltaEq.toFixed(1)}%.`;
} else {
  factoryExplain = `Текущее обслуживание (${p.maintenance} тыс. м.) компенсирует естественный износ станков.`;
}
```

### Математическая реальность в `src/model.js` (строка 161):
$$\Delta \text{equipment} = \text{maintenance} \times 0.044 - \left(0.72 + \frac{\text{production}}{1300} \times 0.18\right)$$

Посчитаем точку безубыточности (Break-Even Maintenance):
$$\text{maintenance}_{\text{neutral}} = \frac{0.72 + \frac{\text{production}}{1300} \times 0.18}{0.044}$$

- При выпуске 500 часов/мес: $\text{износ} = 0.72 + 0.069 = 0.789$ п./мес. $\rightarrow \text{нужно } 17.93$ тыс. марок.
- При выпуске 800 часов/мес: $\text{износ} = 0.72 + 0.111 = 0.831$ п./мес. $\rightarrow \text{нужно } 18.88$ тыс. марок.
- При выпуске 1000 часов/мес: $\text{износ} = 0.72 + 0.138 = 0.858$ п./мес. $\rightarrow \text{нужно } 19.51$ тыс. марок.

При базовой политике по умолчанию:
$$\text{maintenance} = 14 \text{ тыс. марок/мес.}$$
Приток восстановления: $14 \times 0.044 = +0.616$ п./мес.  
Фактический износ при нормальной работе: $\approx -0.83$ п./мес.  
**Чистая дельта**: $\Delta \text{equipment} \approx -0.214$ п./мес. (станки непрерывно деградируют!).

### Дидактический вред:
Поскольку дельта $-0.214$ находится в диапазоне $[-0.5; +0.5]$, код попадает в ветку `else` и радостно сообщает игроку:
> *«Текущее обслуживание (14 тыс. м.) компенсирует естественный износ станков.»*

Это классический пример того, как симулятор **усыпляет бдительность бургомистра**, поощряя когнитивную ловушку Дёрнера: **«Привыкание к ползучему ухудшению» (*Schleichende Verschlechterung*)**. Игрок видит зеленый или нейтральный тон и считает, что ситуация под контролем, пока через 40 месяцев станки не рухнут ниже 30 пунктов.

---

## 2. Корректное системное решение

## 2. Системное решение v1.1 (с учетом замечаний Codex `codex-wear-proposal-review-045`)

Простого сужения порога до $\pm 0.05$ недостаточно из-за трех системных граничных эффектов:
1. **Завершение модернизации (+12 п. к оборудованию)**:
   При вводе проекта модернизации дельта составляет $\approx +11.8$ п. Нельзя приписывать этот скачок текущему обслуживанию (`maintenance: 14`). Необходимо явно разделять ввод мощностей проекта и режим текущего обслуживания.
2. **Граничные насыщения (0% и 100%)**:
   - При `equipment === 0` и нулевом обслуживании дельта равна 0. Это аварийное состояние полного износа, а не «компенсация».
   - При `equipment === 100` дельта равна 0 при любом избыточном обслуживании ($maintenance \ge 19$). Это физический потолок кондиции, а не «точное равновесие».
3. **Длительность шага (1 или 3 месяца)**:
   При ходе на 3 месяца суммарная дельта $\approx -0.64$ п. Нельзя называть её «скоростью в месяц». Требуется явное указание временного интервала: *«За {n0} мес. станки потеряли {n1} п.»*.

### Архитектура логики для `explainStepCauses` (`src/causal.js`):

```javascript
  const monthsElapsed = Math.max(1, current.month - previous.month);
  const deltaEq = current.equipment - previous.equipment;
  const maintenanceVal = p.maintenance ?? 0;
  
  // Проверка завершения проекта модернизации за истекший интервал
  const modernizationsDelta = (current.modernizationLevel || 0) - (previous.modernizationLevel || 0);

  let factoryWearExplain = '';

  if (current.equipment === 0 && previous.equipment === 0) {
    // Граничный случай 1: полный износ
    factoryWearExplain = `Станки полностью изношены (0%). Текущих расходов на обслуживание (${maintenanceVal} тыс. м.) недостаточно для восстановления оборудования.`;
  } else if (current.equipment === 100 && previous.equipment === 100) {
    // Граничный случай 2: потолок 100%
    factoryWearExplain = `Станки работают на максимуме (100%). Обслуживание (${maintenanceVal} тыс. м.) поддерживает идеальное состояние оборудования.`;
  } else if (modernizationsDelta > 0) {
    // Граничный случай 3: ввод модернизации
    const bonusPts = modernizationsDelta * 12;
    if (maintenanceVal < 18) {
      factoryWearExplain = `Завершен ввод модернизации (+${bonusPts} п. к оборудованию). Текущее обслуживание (${maintenanceVal} тыс. м.) при этом остается ниже уровня естественного износа.`;
    } else {
      factoryWearExplain = `Завершен ввод модернизации (+${bonusPts} п. к оборудованию). Обслуживание (${maintenanceVal} тыс. м.) надежно защищает обновленные станки от износа.`;
    }
  } else {
    // Стандартный ход: наблюдаемое изменение за явно названный интервал
    const threshold = 0.05 * monthsElapsed;
    if (deltaEq < -threshold) {
      factoryWearExplain = `За ${monthsElapsed} мес. станки потеряли ${Math.abs(deltaEq).toFixed(1)} п. состояния: обслуживания (${maintenanceVal} тыс. м.) недостаточно против износа и нагрузки.`;
    } else if (deltaEq > threshold) {
      factoryWearExplain = `За ${monthsElapsed} мес. станки восстановились на +${deltaEq.toFixed(1)} п.: обслуживание (${maintenanceVal} тыс. м.) превышает естественный износ.`;
    } else {
      factoryWearExplain = `За ${monthsElapsed} мес. состояние оборудования почти стабильно (${deltaEq >= 0 ? '+' : ''}${deltaEq.toFixed(1)} п.): обслуживание (${maintenanceVal} тыс. м.) близко к равновесию с износом.`;
    }
  }
```

---

## 3. Таблица локализации для всех 4 языков (`src/locales/cockpit.js`)

| Шаблон (RU) | EN | DE | FR |
|---|---|---|---|
| `За {n0} мес. станки потеряли {n1} п. состояния: обслуживания ({n2} тыс. м.) недостаточно против износа и нагрузки.` | `Over {n0} mo., machinery condition fell by {n1} pts: maintenance ({n2}k M) is insufficient against wear.` | `In {n0} Mon. verloren die Maschinen {n1} Zustandspunkte: Wartung ({n2} Tsd. M) reicht nicht gegen den Verschleiß.` | `En {n0} mois, l'état des machines a baissé de {n1} pts : l'entretien ({n2} k M) est insuffisant face à l'usure.` |
| `За {n0} мес. станки восстановились на +{n1} п.: обслуживание ({n2} тыс. м.) превышает естественный износ.` | `Over {n0} mo., machinery condition gained +{n1} pts: maintenance ({n2}k M) exceeds natural wear.` | `In {n0} Mon. erholten sich die Maschinen um +{n1} Zustandspunkte: Wartung ({n2} Tsd. M) übersteigt den Verschleiß.` | `En {n0} mois, l'état des machines a progressé de +{n1} pts : l'entretien ({n2} k M) dépasse l'usure naturelle.` |
| `За {n0} мес. состояние оборудования почти стабильно ({n1} п.): обслуживание ({n2} тыс. м.) близко к равновесию с износом.` | `Over {n0} mo., machinery condition remained nearly stable ({n1} pts): maintenance ({n2}k M) is close to wear equilibrium.` | `In {n0} Mon. blieb der Maschinenzustand nahezu stabil ({n1} Zustandspunkte): Wartung ({n2} Tsd. M) liegt nahe dem Gleichgewicht.` | `En {n0} mois, l'état des machines est resté presque stable ({n1} pts) : l'entretien ({n2} k M) est proche de l'équilibre face à l'usure.` |
| `Станки работают на максимуме (100%). Обслуживание ({n0} тыс. м.) поддерживает идеальное состояние оборудования.` | `Machinery operates at maximum condition (100%). Maintenance ({n0}k M) sustains peak equipment state.` | `Maschinen arbeiten auf Höchststand (100%). Wartung ({n0} Tsd. M) sichert den idealen Zustand.` | `Les machines fonctionnent à leur niveau maximal (100%). L'entretien ({n0} k M) maintient l'état optimal.` |
| `Станки полностью изношены (0%). Текущих расходов на обслуживание ({n0} тыс. м.) недостаточно для восстановления оборудования.` | `Machinery is fully worn out (0%). Current maintenance ({n0}k M) is insufficient to restore equipment.` | `Maschinen sind vollständig abgenutzt (0%). Die laufende Wartung ({n0} Tsd. M) reicht nicht zur Wiederherstellung.` | `Les machines sont totalement usées (0%). L'entretien actuel ({n0} k M) ne suffit pas à restaurer l'équipement.` |
| `Завершен ввод модернизации (+12 п. к оборудованию). Текущее обслуживание ({n0} тыс. м.) при этом остается ниже уровня естественного износа.` | `Modernization commissioned (+12 pts equipment). Current maintenance ({n0}k M) remains below natural wear.` | `Modernisierung in Betrieb genommen (+12 Maschinenpunkte). Laufende Wartung ({n0} Tsd. M) bleibt unter dem natürlichen Verschleiß.` | `Modernisation mise en service (+12 pts d'équipement). L'entretien actuel ({n0} k M) reste en dessous de l'usure naturelle.` |
| `Завершен ввод модернизации (+12 п. к оборудованию). Обслуживание ({n0} тыс. м.) надежно защищает обновленные станки от износа.` | `Modernization commissioned (+12 pts equipment). Maintenance ({n0}k M) reliably protects updated machinery from wear.` | `Modernisierung in Betrieb genommen (+12 Maschinenpunkte). Wartung ({n0} Tsd. M) schützt die erneuerten Maschinen zuverlässig vor Verschleiß.` | `Modernisation mise en service (+12 pts d'équipement). L'entretien ({n0} k M) protège efficacement les machines rénovées contre l'usure.` |

---

## 4. План реализации и критерии приемки
1. **Тесты**:
   - Шаг +1 мес. при $maintenance=14$: фраза фиксирует снижение $\approx -0.2$ п.
   - Шаг +3 мес. при $maintenance=14$: фраза фиксирует снижение за 3 мес. $\approx -0.6$ п.
   - Граница `equipment=0`: фраза фиксирует полный износ, без ложной компенсации.
   - Граница `equipment=100`: фраза фиксирует поддержание максимума, без ложного «точного баланса».
   - Ввод модернизации: завершение проекта не приписывается текущему обслуживанию.
   - 100% перевод на `en`, `de`, `fr` без латиницы/кириллицы в чужих языках.
2. **Протокол**:
   - Передать обновленное решение Codex (`COORDINATION/mail/codex/`).
   - Получить ACCEPT и согласование границ перед изменением `src/causal.js` и `src/locales/cockpit.js`.

