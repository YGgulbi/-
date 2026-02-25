import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Sparkles } from 'lucide-react';
import { Button } from './ui/common';
import { cn } from '../lib/utils';

export interface SituationCard {
  id: string;
  question: string;
  title: string;
  category: string;
  emotion: string;
}

const CARDS: SituationCard[] = [
  { id: 'c1', question: "친구들 사이에서 여행 계획 짰던 적 있어?", title: "여행 계획 주도", category: "대외활동", emotion: "즐거움" },
  { id: 'c2', question: "알바하다가 진상 손님 때문에 욱했는데 참은 적 있어?", title: "진상 손님 대처", category: "아르바이트", emotion: "당황" },
  { id: 'c3', question: "밤새서 무언가에 몰입해 본 적 있어?", title: "밤샘 몰입 경험", category: "교내활동", emotion: "즐거움" },
  { id: 'c4', question: "팀 프로젝트에서 아무도 안 하려는 역할 총대 멘 적 있어?", title: "팀 프로젝트 총대", category: "교내활동", emotion: "도전" },
  { id: 'c5', question: "처음 해보는 일인데 맨땅에 헤딩해서 성공한 적 있어?", title: "맨땅에 헤딩 성공", category: "대외활동", emotion: "성취" },
  { id: 'c6', question: "남들이 다 포기한 일, 끝까지 물고 늘어진 적 있어?", title: "포기하지 않은 끈기", category: "기타", emotion: "성취" },
  { id: 'c7', question: "내 아이디어가 채택되어서 실제로 실행된 적 있어?", title: "아이디어 실행", category: "공모전", emotion: "성취" },
  { id: 'c8', question: "취미로 시작한 일이 생각보다 커져서 성과를 얻은 적 있어?", title: "취미의 확장", category: "대외활동", emotion: "즐거움" },
  { id: 'c9', question: "누군가를 진심으로 도와주고 큰 고마움을 받은 적 있어?", title: "타인 도움 경험", category: "기타", emotion: "즐거움" },
  { id: 'c10', question: "발표나 무대 위에서 엄청 떨렸지만 무사히 마친 적 있어?", title: "떨렸던 무대/발표", category: "교내활동", emotion: "성취" },
  { id: 'c11', question: "예상치 못한 큰 실수를 했지만, 어떻게든 수습한 적 있어?", title: "큰 실수 수습", category: "기타", emotion: "당황" },
  { id: 'c12', question: "낯선 환경에 혼자 던져져서 적응한 적 있어?", title: "낯선 환경 적응", category: "대외활동", emotion: "성취" },
  { id: 'c13', question: "리더가 되어 팀원들의 갈등을 중재해 본 적 있어?", title: "팀 갈등 중재", category: "교내활동", emotion: "성취" },
  { id: 'c14', question: "평소라면 절대 안 할 법한 일에 충동적으로 도전해 본 적 있어?", title: "충동적인 새로운 도전", category: "기타", emotion: "즐거움" },
  { id: 'c15', question: "오랫동안 준비한 시험이나 대회에서 원하던 결과를 얻은 적 있어?", title: "장기 목표 달성", category: "성적", emotion: "성취" },
  { id: 'c16', question: "정말 열심히 했는데 처참하게 실패해 본 적 있어?", title: "뼈아픈 실패 경험", category: "기타", emotion: "두려움" },
  { id: 'c17', question: "나만의 루틴이나 습관을 한 달 이상 꾸준히 유지해 본 적 있어?", title: "꾸준한 루틴 유지", category: "기타", emotion: "성취" },
  { id: 'c18', question: "다른 사람을 설득해서 내 의견대로 이끌어 본 적 있어?", title: "타인 설득 경험", category: "교내활동", emotion: "성취" },
  { id: 'c19', question: "돈을 모아서 평소 갖고 싶었던 큰 물건을 내 힘으로 사본 적 있어?", title: "스스로 모은 돈으로 성취", category: "아르바이트", emotion: "성취" },
  { id: 'c20', question: "아무런 보상 없이 순수하게 좋아서 푹 빠졌던 활동이 있어?", title: "순수한 몰입", category: "기타", emotion: "즐거움" },
];

interface ExperienceCardPickerProps {
  onSelect: (cards: SituationCard[]) => void;
  onClose: () => void;
}

export function ExperienceCardPicker({ onSelect, onClose }: ExperienceCardPickerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleCard = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleComplete = () => {
    const selectedCards = CARDS.filter(c => selectedIds.has(c.id));
    onSelect(selectedCards);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#FDFCF8] w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="text-indigo-500" />
              이런 적 있어?
            </h2>
            <p className="text-gray-500 mt-1 text-sm">
              나의 경험을 떠올리기 어렵다면, 아래 카드 중 공감되는 상황을 모두 골라주세요!
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body (Cards Grid) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"
          >
            {CARDS.map((card) => {
              const isSelected = selectedIds.has(card.id);
              return (
                <motion.div
                  key={card.id}
                  variants={itemVariants}
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleCard(card.id)}
                  className={cn(
                    "cursor-pointer aspect-[3/4] rounded-xl p-5 flex flex-col justify-center items-center text-center relative transition-all duration-200 shadow-sm border-2 select-none",
                    isSelected 
                      ? "bg-indigo-50 border-indigo-500 shadow-md" 
                      : "bg-white border-transparent hover:border-indigo-200 hover:shadow-md"
                  )}
                >
                  {isSelected && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3 bg-indigo-500 text-white rounded-full p-1 shadow-sm"
                    >
                      <Check size={14} strokeWidth={3} />
                    </motion.div>
                  )}
                  <p className={cn(
                    "font-bold text-sm md:text-base leading-relaxed break-keep", 
                    isSelected ? "text-indigo-900" : "text-slate-700"
                  )}>
                    "{card.question}"
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 bg-white border-t border-gray-200 flex justify-between items-center z-10">
          <div className="text-sm font-medium text-gray-600">
            선택된 카드: <span className="text-indigo-600 font-bold text-lg">{selectedIds.size}</span>장
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>취소</Button>
            <Button 
              onClick={handleComplete} 
              disabled={selectedIds.size === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
            >
              내 인생지도에 추가하기
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
