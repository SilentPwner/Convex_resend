// lib/sentimentAnalysis.ts
import * as natural from "natural";

const analyzer = new natural.SentimentAnalyzer();
const stemmer = natural.PorterStemmer;

// قوائم الكلمات المخصصة
const POSITIVE_WORDS = ["happy", "joy", "love", "good", "great"];
const NEGATIVE_WORDS = ["sad", "angry", "hate", "bad", "awful"];

export function analyzeTone(text: string) {
  // 1. تنظيف النص
  const cleaned = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");

  // 2. تحليل المشاعر الأساسي
  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(cleaned) || [];
  const stems = tokens.map(t => stemmer.stem(t));
  
  // 3. حساب النتيجة (-1 إلى 1)
  let score = 0;
  
  // تحليل كل كلمة
  stems.forEach(stem => {
    if (POSITIVE_WORDS.includes(stem)) score += 0.2;
    if (NEGATIVE_WORDS.includes(stem)) score -= 0.2;
  });

  // تطبيع النتيجة
  score = Math.max(-1, Math.min(1, score / Math.max(1, stems.length)));

  return {
    score,
    positiveWords: stems.filter(s => POSITIVE_WORDS.includes(s)),
    negativeWords: stems.filter(s => NEGATIVE_WORDS.includes(s))
  };
}