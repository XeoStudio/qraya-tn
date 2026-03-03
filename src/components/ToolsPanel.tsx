'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FileText, 
  Target, 
  Layers, 
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

interface Flashcard {
  question: string
  answer: string
}

export default function ToolsPanel() {
  const [activeTool, setActiveTool] = useState<string>('summarize')

  return (
    <Card className="max-w-4xl mx-auto overflow-hidden border-0 shadow-xl">
      <Tabs value={activeTool} onValueChange={setActiveTool}>
        <div className="border-b bg-gray-50 dark:bg-gray-900">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="summarize" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">تلخيص</span>
            </TabsTrigger>
            <TabsTrigger value="quiz" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">أسئلة</span>
            </TabsTrigger>
            <TabsTrigger value="flashcards" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">بطاقات</span>
            </TabsTrigger>
            <TabsTrigger value="study-plan" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">خطة</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="p-6">
          <TabsContent value="summarize">
            <SummarizeTool />
          </TabsContent>
          <TabsContent value="quiz">
            <QuizTool />
          </TabsContent>
          <TabsContent value="flashcards">
            <FlashcardsTool />
          </TabsContent>
          <TabsContent value="study-plan">
            <StudyPlanTool />
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  )
}

function MessageAlert({ type, message }: { type: 'success' | 'error'; message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <Alert className={type === 'error' 
        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
        : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      }>
        {type === 'error' 
          ? <AlertCircle className="h-4 w-4 text-red-500" />
          : <CheckCircle2 className="h-4 w-4 text-green-500" />
        }
        <AlertDescription className={type === 'error' 
          ? 'text-red-700 dark:text-red-300' 
          : 'text-green-700 dark:text-green-300'
        }>
          {message}
        </AlertDescription>
      </Alert>
    </motion.div>
  )
}

function SummarizeTool() {
  const [content, setContent] = useState('')
  const [level, setLevel] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSummarize = async () => {
    if (!content.trim()) return
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, level }),
        credentials: 'include'
      })
      const data = await res.json()
      if (data.success) {
        setResult(data.summary)
      } else {
        setError(data.error || 'حدث خطأ في التلخيص')
      }
    } catch {
      setError('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">تلخيص المحتوى</h3>
        <p className="text-sm text-gray-500 mb-4">أدخل النص الذي تريد تلخيصه</p>
      </div>

      {error && <MessageAlert type="error" message={error} />}

      <div className="space-y-4">
        <div>
          <Label>المحتوى</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="الصق النص هنا... (أدخل على الأقل 10 أحرف)"
            className="min-h-[200px]"
          />
        </div>

        <div>
          <Label>المستوى الدراسي (اختياري)</Label>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger>
              <SelectValue placeholder="اختر المستوى" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">ابتدائي</SelectItem>
              <SelectItem value="preparatory">إعدادي</SelectItem>
              <SelectItem value="secondary">ثانوي</SelectItem>
              <SelectItem value="bac">باكالوريا</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleSummarize} 
          disabled={content.trim().length < 10 || loading} 
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />جاري التلخيص...</>
          ) : (
            'تلخيص الآن'
          )}
        </Button>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border"
          >
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              الملخص:
            </h4>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{result}</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function QuizTool() {
  const [topic, setTopic] = useState('')
  const [count, setCount] = useState('5')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!topic.trim()) return
    setLoading(true)
    setQuestions([])
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowExplanation(false)
    setScore(0)
    setError(null)

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, count: parseInt(count), difficulty }),
        credentials: 'include'
      })
      const data = await res.json()
      if (data.success && data.questions.length > 0) {
        setQuestions(data.questions)
      } else {
        setError(data.error || 'لم أتمكن من إنشاء الأسئلة')
      }
    } catch {
      setError('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null) return
    setSelectedAnswer(answerIndex)
    setShowExplanation(true)
    if (answerIndex === questions[currentQuestion].correctAnswer) {
      setScore(s => s + 1)
    }
  }

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(c => c + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(c => c - 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
    }
  }

  if (questions.length > 0) {
    const q = questions[currentQuestion]
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-base px-4 py-2">
            السؤال {currentQuestion + 1} من {questions.length}
          </Badge>
          <Badge variant="outline" className="text-base px-4 py-2">
            النتيجة: {score}/{questions.length}
          </Badge>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="font-medium mb-4 text-lg">{q.question}</p>
          <div className="space-y-2">
            {q.options.map((option, i) => (
              <Button
                key={i}
                variant={selectedAnswer === i 
                  ? (i === q.correctAnswer ? 'default' : 'destructive')
                  : (showExplanation && i === q.correctAnswer ? 'default' : 'outline')
                }
                className={`w-full justify-start text-right h-auto py-3 ${
                  showExplanation && i === q.correctAnswer ? 'bg-green-500 hover:bg-green-600 text-white' : ''
                }`}
                onClick={() => handleAnswer(i)}
                disabled={selectedAnswer !== null}
              >
                <span className="ml-2 font-bold">{['أ', 'ب', 'ج', 'د'][i]}.</span>
                <span>{option}</span>
                {showExplanation && i === q.correctAnswer && (
                  <CheckCircle className="w-5 h-5 mr-auto" />
                )}
                {selectedAnswer === i && i !== q.correctAnswer && (
                  <XCircle className="w-5 h-5 mr-auto" />
                )}
              </Button>
            ))}
          </div>
        </div>

        {showExplanation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <strong className="text-blue-700 dark:text-blue-300">💡 الشرح:</strong>
            <p className="text-sm mt-1 text-blue-600 dark:text-blue-400">{q.explanation}</p>
          </motion.div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={prevQuestion} disabled={currentQuestion === 0}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button 
            onClick={nextQuestion} 
            disabled={currentQuestion === questions.length - 1 || selectedAnswer === null}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
          >
            {currentQuestion === questions.length - 1 ? 'إنهاء' : 'التالي'}
          </Button>
          <Button variant="outline" onClick={() => setQuestions([])}>
            أسئلة جديدة
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">أسئلة تدريبية</h3>
        <p className="text-sm text-gray-500 mb-4">أنشئ أسئلة MCQ حول أي موضوع</p>
      </div>

      {error && <MessageAlert type="error" message={error} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-3">
          <Label>الموضوع</Label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="مثال: المعادلات الكيميائية، الثورة الفرنسية..."
          />
        </div>
        <div>
          <Label>عدد الأسئلة</Label>
          <Select value={count} onValueChange={setCount}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 أسئلة</SelectItem>
              <SelectItem value="5">5 أسئلة</SelectItem>
              <SelectItem value="10">10 أسئلة</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>الصعوبة</Label>
          <Select value={difficulty} onValueChange={(v) => setDifficulty(v as 'easy' | 'medium' | 'hard')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">سهل</SelectItem>
              <SelectItem value="medium">متوسط</SelectItem>
              <SelectItem value="hard">صعب</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button 
        onClick={handleGenerate} 
        disabled={!topic.trim() || loading} 
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />جاري الإنشاء...</>
        ) : (
          'إنشاء الأسئلة'
        )}
      </Button>
    </div>
  )
}

function FlashcardsTool() {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentCard, setCurrentCard] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!topic.trim()) return
    setLoading(true)
    setFlashcards([])
    setCurrentCard(0)
    setFlipped(false)
    setError(null)

    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
        credentials: 'include'
      })
      const data = await res.json()
      if (data.success && data.flashcards.length > 0) {
        setFlashcards(data.flashcards)
      } else {
        setError(data.error || 'لم أتمكن من إنشاء البطاقات')
      }
    } catch {
      setError('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  if (flashcards.length > 0) {
    const card = flashcards[currentCard]
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-base px-4 py-2">
            البطاقة {currentCard + 1} من {flashcards.length}
          </Badge>
        </div>

        <div
          onClick={() => setFlipped(!flipped)}
          className="min-h-[220px] bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 cursor-pointer flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all"
        >
          <motion.div
            key={flipped ? 'back' : 'front'}
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            className="text-center"
          >
            <p className="text-xl font-medium">{flipped ? card.answer : card.question}</p>
            <p className="text-sm mt-6 opacity-70">
              {flipped ? '👆 انقر للسؤال' : '👆 انقر للإجابة'}
            </p>
          </motion.div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => { setCurrentCard(c => c - 1); setFlipped(false) }}
            disabled={currentCard === 0}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => { setCurrentCard(c => c + 1); setFlipped(false) }}
            disabled={currentCard === flashcards.length - 1}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
          >
            البطاقة التالية
          </Button>
          <Button variant="outline" onClick={() => setFlashcards([])}>
            بطاقات جديدة
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">بطاقات المراجعة</h3>
        <p className="text-sm text-gray-500 mb-4">أنشئ بطاقات Q/A للمراجعة السريعة</p>
      </div>

      {error && <MessageAlert type="error" message={error} />}

      <div>
        <Label>الموضوع</Label>
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="مثال: المصطلحات الفيزيائية، تعريفات التاريخ..."
        />
      </div>

      <Button 
        onClick={handleGenerate} 
        disabled={!topic.trim() || loading} 
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />جاري الإنشاء...</>
        ) : (
          'إنشاء البطاقات'
        )}
      </Button>
    </div>
  )
}

function StudyPlanTool() {
  const [subjects, setSubjects] = useState('')
  const [days, setDays] = useState('7')
  const [hoursPerDay, setHoursPerDay] = useState('3')
  const [goal, setGoal] = useState('')
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!subjects.trim()) return
    setLoading(true)
    setPlan(null)
    setError(null)

    try {
      const res = await fetch('/api/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjects: subjects.split(',').map(s => s.trim()).filter(Boolean),
          days: parseInt(days),
          hoursPerDay: parseInt(hoursPerDay),
          goal
        }),
        credentials: 'include'
      })
      const data = await res.json()
      if (data.success) {
        setPlan(data.studyPlan)
      } else {
        setError(data.error || 'حدث خطأ في إنشاء الخطة')
      }
    } catch (err) {
      console.error('Failed to generate study plan:', err)
      setError('حدث خطأ في الاتصال. تأكد من تسجيل الدخول.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">خطة الدراسة</h3>
        <p className="text-sm text-gray-500 mb-4">أنشئ خطة دراسة مخصصة لك</p>
      </div>

      {error && <MessageAlert type="error" message={error} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label>المواد الدراسية (افصل بفاصلة)</Label>
          <Input
            value={subjects}
            onChange={(e) => setSubjects(e.target.value)}
            placeholder="مثال: رياضيات, فيزياء, فرنسية"
          />
        </div>
        <div>
          <Label>عدد الأيام</Label>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 أيام</SelectItem>
              <SelectItem value="14">14 يوم</SelectItem>
              <SelectItem value="30">30 يوم</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>ساعات الدراسة اليومية</Label>
          <Select value={hoursPerDay} onValueChange={setHoursPerDay}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 ساعات</SelectItem>
              <SelectItem value="3">3 ساعات</SelectItem>
              <SelectItem value="4">4 ساعات</SelectItem>
              <SelectItem value="5">5 ساعات</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>الهدف (اختياري)</Label>
          <Input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="مثال: التحضير لامتحان الباكالوريا"
          />
        </div>
      </div>

      <Button 
        onClick={handleGenerate} 
        disabled={!subjects.trim() || loading} 
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />جاري الإنشاء...</>
        ) : (
          'إنشاء الخطة'
        )}
      </Button>

      {plan && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border max-h-[400px] overflow-y-auto"
        >
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            خطة الدراسة:
          </h4>
          <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{plan}</pre>
        </motion.div>
      )}
    </div>
  )
}
