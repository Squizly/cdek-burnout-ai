import { MaslachQuestion } from '../types'

export const maslachQuestions: MaslachQuestion[] = [
  // Эмоциональное истощение
  { id: 1, text: "Я чувствую себя эмоционально опустошенным(ой) из-за моей работы", category: 'exhaustion' },
  { id: 2, text: "К концу рабочего дня я чувствую себя как выжатый лимон", category: 'exhaustion' },
  { id: 3, text: "Я чувствую усталость, когда встаю утром и должен(на) идти на работу", category: 'exhaustion' },
  { id: 4, text: "Весь день работать с людьми - это стресс для меня", category: 'exhaustion' },
  { id: 5, text: "Я чувствую себя измотанным(ой) своей работой", category: 'exhaustion' },
  { id: 6, text: "Моя работа приводит меня в отчаяние", category: 'exhaustion' },
  { id: 7, text: "Я чувствую, что работаю слишком много", category: 'exhaustion' },
  { id: 8, text: "Работа с людьми создает слишком много стресса", category: 'exhaustion' },
  { id: 9, text: "Я чувствую себя на грани срыва", category: 'exhaustion' },

  // Деперсонализация
  { id: 10, text: "Я чувствую, что обращаюсь с некоторыми коллегами безлично", category: 'depersonalization' },
  { id: 11, text: "С тех пор как начал(а) работать, я стал(а) более черствым(ой) к людям", category: 'depersonalization' },
  { id: 12, text: "Я боюсь, что моя работа делает меня эмоционально жестким(ой)", category: 'depersonalization' },
  { id: 13, text: "Меня не волнует, что происходит с моими коллегами", category: 'depersonalization' },
  { id: 14, text: "Я чувствую, что коллеги винят меня в своих проблемах", category: 'depersonalization' },

  // Редукция профессиональных достижений
  { id: 15, text: "Я легко понимаю, что чувствуют мои коллеги", category: 'achievement' },
  { id: 16, text: "Я эффективно решаю проблемы моих коллег", category: 'achievement' },
  { id: 17, text: "Я чувствую, что положительно влияю на жизнь людей своей работой", category: 'achievement' },
  { id: 18, text: "Я полон(на) энергии", category: 'achievement' },
  { id: 19, text: "Я легко создаю расслабленную атмосферу с коллегами", category: 'achievement' },
  { id: 20, text: "Я чувствую себя воодушевленным(ой) после работы с коллегами", category: 'achievement' },
  { id: 21, text: "Я многого достиг(ла) в своей профессии", category: 'achievement' },
  { id: 22, text: "В работе я спокойно справляюсь с эмоциональными проблемами", category: 'achievement' }
]

export const answerOptions = [
  { label: 'Никогда', value: 0 },
  { label: 'Очень редко', value: 1 },
  { label: 'Редко', value: 2 },
  { label: 'Иногда', value: 3 },
  { label: 'Часто', value: 4 },
  { label: 'Очень часто', value: 5 },
  { label: 'Каждый день', value: 6 }
]