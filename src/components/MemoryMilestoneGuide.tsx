import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, MapPin, Flag, CheckCircle2 } from 'lucide-react';
import { Button, Input, Textarea } from './ui/common';
import { Experience } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface Milestone {
  id: string;
  title: string;
  question: string;
  description: string;
  icon: string;
  defaultCategory: string;
  defaultEmotion: string;
}

const MILESTONES: Milestone[] = [
  {
    id: 'm1',
    title: '첫 성취의 순간',
    question: '내 힘으로 무언가를 이뤄내어 가장 뿌듯했던 순간은 언제인가요?',
    description: '작은 목표라도 괜찮아요. 스스로 노력해서 얻어낸 결과물을 떠올려보세요.',
    icon: '🏆',
    defaultCategory: '기타',
    defaultEmotion: '성취',
  },
  {
    id: 'm2',
    title: '시련과 극복',
    question: '가장 힘들었거나 실패했던 경험, 그리고 그것을 어떻게 넘겼나요?',
    description: '실패 자체보다, 그 이후에 내가 어떤 행동을 취했는지가 더 중요해요.',
    icon: '🌧️',
    defaultCategory: '기타',
    defaultEmotion: '두려움',
  },
  {
    id: 'm3',
    title: '소중한 인연과 협력',
    question: '나에게 큰 영향을 주었거나, 최고의 팀워크를 발휘했던 경험이 있나요?',
    description: '누군가와 함께 문제를 해결했거나, 깊은 영감을 받았던 사람을 떠올려보세요.',
    icon: '🤝',
    defaultCategory: '대외활동',
    defaultEmotion: '즐거움',
  },
  {
    id: 'm4',
    title: '결정적 터닝포인트',
    question: '나의 생각이나 가치관, 진로가 크게 바뀌게 된 결정적인 사건이 있나요?',
    description: '우연한 기회, 책 한 권, 혹은 누군가의 한 마디도 좋아요.',
    icon: '💡',
    defaultCategory: '기타',
    defaultEmotion: '당황',
  },
  {
    id: 'm5',
    title: '순수한 몰입',
    question: '시간 가는 줄 모르고, 누가 시키지 않아도 푹 빠져서 했던 활동은 무엇인가요?',
    description: '나의 진짜 흥미와 열정이 어디로 향하는지 알 수 있는 중요한 단서입니다.',
    icon: '🔥',
    defaultCategory: '기타',
    defaultEmotion: '즐거움',
  },
];

interface MemoryMilestoneGuideProps {
  onComplete: (experiences: Experience[]) => void;
  onClose: () => void;
}

export function MemoryMilestoneGuide({ onComplete, onClose }: MemoryMilestoneGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { title: string; description: string; date: string }>>({});

  const milestone = MILESTONES[currentStep];
  const currentAnswer = answers[milestone.id] || { title: '', description: '', date: '' };

  const handleNext = () => {
    if (currentStep < MILESTONES.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      finishGuide();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const updateAnswer = (field: 'title' | 'description' | 'date', value: string) => {
    setAnswers(prev => ({
      ...prev,
      [milestone.id]: {
        ...currentAnswer,
        [field]: value
      }
    }));
  };

  const finishGuide = () => {
    const newExperiences: Experience[] = [];
    
    MILESTONES.forEach(m => {
      const ans = answers[m.id];
      if (ans && (ans.title.trim() || ans.description.trim())) {
        const defaultDate = new Date().toISOString().split('T')[0].replace(/-/g, '.');
        newExperiences.push({
          id: uuidv4(),
          title: ans.title.trim() || `${m.title} 관련 경험`,
          startDate: ans.date || defaultDate,
          endDate: ans.date || defaultDate,
          description: ans.description.trim() || '내용 없음',
          category: m.defaultCategory,
          satisfaction: 5,
          emotion: m.defaultEmotion,
          tags: [],
          attachments: [],
        });
      }
    });

    onComplete(newExperiences);
  };

  const progress = ((currentStep + 1) / MILESTONES.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center relative shrink-0">
          <div className="flex items-center gap-2 text-emerald-600 font-bold">
            <MapPin size={20} />
            기억의 이정표
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X size={24} />
          </button>
          
          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 h-1 bg-gray-100 w-full">
            <motion.div 
              className="h-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="p-4 md:p-8 flex-1 min-h-[300px] flex flex-col justify-start md:justify-center relative overflow-y-auto bg-[#FDFCF8]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-xl mx-auto w-full space-y-4 md:space-y-6 py-4"
            >
              <div className="text-center space-y-2 md:space-y-4 mb-4 md:mb-8">
                <div className="text-4xl md:text-5xl mb-2 md:mb-4">{milestone.icon}</div>
                <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs md:text-sm font-bold rounded-full mb-2">
                  이정표 {currentStep + 1} / {MILESTONES.length}
                </div>
                <h2 className="text-xl md:text-3xl font-bold text-gray-900 break-keep leading-tight">
                  {milestone.question}
                </h2>
                <p className="text-sm md:text-base text-gray-500">{milestone.description}</p>
              </div>

              <div className="space-y-4 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">경험의 제목</label>
                  <Input 
                    placeholder="예: 첫 해커톤 대상 수상, 3개월간의 유럽 배낭여행" 
                    value={currentAnswer.title}
                    onChange={(e) => updateAnswer('title', e.target.value)}
                    className="bg-gray-50 border-gray-200 focus:bg-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">그때의 이야기</label>
                  <Textarea 
                    placeholder="어떤 일이 있었나요? 무엇을 배웠고, 어떻게 변했는지 자유롭게 적어주세요." 
                    value={currentAnswer.description}
                    onChange={(e) => updateAnswer('description', e.target.value)}
                    className="h-24 md:h-32 bg-gray-50 border-gray-200 focus:bg-white resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">시기 (선택)</label>
                  <Input 
                    placeholder="YYYY.MM.DD (예: 2023.05.12)" 
                    value={currentAnswer.date}
                    onChange={(e) => updateAnswer('date', e.target.value)}
                    className="bg-gray-50 border-gray-200 focus:bg-white font-mono"
                  />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 bg-white border-t border-gray-100 flex justify-between items-center shrink-0">
          {currentStep === 0 ? (
            <Button 
              variant="ghost" 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700"
            >
              나가기
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              onClick={handlePrev} 
              className="text-gray-500 hover:text-gray-700"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> 이전
            </Button>
          )}
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleNext}
              className="text-gray-500 hover:text-gray-700"
            >
              건너뛰기
            </Button>
            
            <Button 
              onClick={handleNext}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 shadow-md"
            >
              {currentStep === MILESTONES.length - 1 ? (
                <>완료하기 <Flag className="w-4 h-4 ml-2" /></>
              ) : (
                <>다음 <ChevronRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
