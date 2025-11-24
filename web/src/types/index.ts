export interface MaslachQuestion {
  id: number
  text: string
  category: 'exhaustion' | 'depersonalization' | 'achievement'
}

export interface TestResult {
  exhaustion: number
  depersonalization: number 
  achievement: number
  burnoutLevel: 'low' | 'medium' | 'high'
  date: Date
}

export interface ReactionTestResult {
  averageTime: number
  minTime: number
  maxTime: number
  attempts: number[]
  rating: 'excellent' | 'good' | 'normal' | 'slow'
}

export interface Employee {
  id: string
  name: string
  department: string
  position: string
  email: string
  lastTestDate?: Date
  testResults?: TestResult[]
}