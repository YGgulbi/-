import React, { useState } from 'react';
import { AnalysisResult, Experience } from '../types';
import { Card, Button } from './ui/common';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ArrowLeft, Download, Share2, CheckCircle2, Loader2, Network } from 'lucide-react';
import { ExperienceGraph } from './ExperienceGraph';
import { generateChecklist } from '../services/analysis';

interface AnalysisViewProps {
  result: AnalysisResult;
  experiences: Experience[];
  onBack: () => void;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6'];

export function AnalysisView({ result, experiences, onBack }: AnalysisViewProps) {
  const [selectedAction, setSelectedAction] = useState<number | null>(null);
  const [checklists, setChecklists] = useState<Record<number, string[]>>({});
  const [loadingChecklist, setLoadingChecklist] = useState<number | null>(null);

  const handleActionClick = async (index: number, action: string) => {
    if (selectedAction === index) {
      setSelectedAction(null);
      return;
    }
    
    setSelectedAction(index);
    
    if (!checklists[index]) {
      setLoadingChecklist(index);
      try {
        const list = await generateChecklist(action, experiences);
        setChecklists(prev => ({ ...prev, [index]: list }));
      } finally {
        setLoadingChecklist(null);
      }
    }
  };

  // Calculate category distribution
  const categoryData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    experiences.forEach(exp => {
      counts[exp.category] = (counts[exp.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [experiences]);

  // Calculate energy over time (sorted by date)
  const energyData = React.useMemo(() => {
    const parseDate = (dateStr: string) => {
      if (!dateStr || typeof dateStr !== 'string') return new Date();
      const normalized = dateStr.replace(/\./g, '-');
      const date = new Date(normalized);
      return isNaN(date.getTime()) ? new Date() : date;
    };

    return [...experiences]
      .sort((a, b) => {
        const dateA = a.startDate || (a as any).date;
        const dateB = b.startDate || (b as any).date;
        return parseDate(dateA).getTime() - parseDate(dateB).getTime();
      })
      .map(exp => ({
        date: exp.startDate || (exp as any).date,
        energy: exp.satisfaction || (exp as any).energyLevel || 5,
        title: exp.title
      }));
  }, [experiences]);

  const categoryLabels: Record<string, string> = {
    enjoyment: '즐거움',
    achievement: '성취',
    challenge: '도전',
    learning: '배움',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="ghost" className="pl-0 hover:pl-2 transition-all">
          <ArrowLeft className="mr-2 h-4 w-4" /> 타임라인으로 돌아가기
        </Button>
        <div className="flex gap-2">
            <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" /> 공유하기
            </Button>
            <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" /> PDF 내보내기
            </Button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-bold text-gray-900">나의 DNA 프로필</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">{result.summary}</p>
      </motion.div>

      {/* Visual Data Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
        >
            <Card className="p-6 h-full flex flex-col">
                <h3 className="text-lg font-bold mb-4 text-gray-900">경험 구성</h3>
                <div className="h-64 w-full flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 text-xs text-gray-500 mt-4 flex-wrap">
                    {categoryData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="capitalize">{categoryLabels[entry.name] || entry.name}</span>
                        </div>
                    ))}
                </div>
            </Card>
        </motion.div>

        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
        >
            <Card className="p-6 h-full flex flex-col">
                <h3 className="text-lg font-bold mb-4 text-gray-900">에너지 흐름</h3>
                <div className="h-64 w-full flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={energyData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="date" hide />
                            <YAxis domain={[0, 10]} hide />
                            <RechartsTooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="energy" 
                                stroke="#6366f1" 
                                strokeWidth={3} 
                                dot={{ fill: '#6366f1', r: 4 }} 
                                activeDot={{ r: 6 }} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-xs text-center text-gray-400 mt-4">시간에 따른 에너지 변화</p>
            </Card>
        </motion.div>
      </div>

      {/* Graph RAG Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <ExperienceGraph experiences={experiences} relationships={Array.isArray(result.relationships) ? result.relationships : []} />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths Card */}
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
        >
            <Card className="p-6 h-full border-t-4 border-t-indigo-500 bg-white">
            <h3 className="text-lg font-bold mb-4 flex items-center">
                <span className="bg-indigo-100 text-indigo-700 p-2 rounded-lg mr-3">💪</span>
                나의 강점 (Superpowers)
            </h3>
            <ul className="space-y-3">
                {(result.strengths || []).map((item, i) => (
                    <li key={i} className="flex items-start group">
                        <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 mt-2 mr-3 group-hover:scale-125 transition-transform" />
                        <span className="text-gray-700 font-medium">{item}</span>
                    </li>
                ))}
            </ul>
            </Card>
        </motion.div>

        {/* Interests Card */}
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
        >
            <Card className="p-6 h-full border-t-4 border-t-emerald-500 bg-white">
            <h3 className="text-lg font-bold mb-4 flex items-center">
                <span className="bg-emerald-100 text-emerald-700 p-2 rounded-lg mr-3">❤️</span>
                나의 흥미 (Passions)
            </h3>
            <ul className="space-y-3">
                {(result.interests || []).map((item, i) => (
                    <li key={i} className="flex items-start group">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mt-2 mr-3 group-hover:scale-125 transition-transform" />
                        <span className="text-gray-700 font-medium">{item}</span>
                    </li>
                ))}
            </ul>
            </Card>
        </motion.div>
      </div>

      {/* Deep Dive Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 md:col-span-1 bg-gray-900 text-white flex flex-col justify-between">
            <div>
                <h3 className="text-lg font-bold mb-4 text-gray-100">에너지 방향성</h3>
                <div className="flex justify-center my-6">
                    <div className="text-6xl animate-pulse">⚡</div>
                </div>
            </div>
            <p className="text-center text-gray-300 text-sm font-medium leading-relaxed">{result.energyDirection}</p>
        </Card>

        <Card className="p-6 md:col-span-2 flex flex-col">
            <h3 className="text-lg font-bold mb-4">문제 해결 스타일</h3>
            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 flex-1 flex items-center">
                <p className="text-indigo-900 text-lg leading-relaxed font-medium">{result.problemSolvingStyle}</p>
            </div>
        </Card>
      </div>

      {/* Action Plan */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-8 border-2 border-dashed border-gray-300 bg-gray-50">
            <h3 className="text-2xl font-bold mb-8 text-center flex items-center justify-center gap-2">
                <span>🚀</span> 추천 액션 플랜
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(result.actionPlan || []).map((action, i) => (
                    <div 
                        key={i} 
                        onClick={() => handleActionClick(i, action)}
                        className={`bg-white p-6 rounded-xl shadow-sm border transition-all relative overflow-hidden group cursor-pointer ${
                            selectedAction === i ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-200 hover:shadow-md'
                        }`}
                    >
                        <div className="absolute -right-4 -top-4 text-9xl font-black text-gray-50 opacity-50 group-hover:opacity-100 group-hover:text-indigo-50 transition-all select-none pointer-events-none">
                            {i + 1}
                        </div>
                        <div className="relative z-10">
                            <div className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-2">Step 0{i + 1}</div>
                            <p className="font-bold text-gray-800 text-lg leading-snug">{action}</p>
                            
                            <AnimatePresence>
                                {selectedAction === i && (
                                    <motion.div
                                        key={`checklist-${i}`}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-4 pt-4 border-t border-gray-100"
                                    >
                                        {loadingChecklist === i ? (
                                            <div className="flex items-center justify-center py-4">
                                                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                                            </div>
                                        ) : (
                                            <ul className="space-y-2">
                                                {checklists[i]?.map((item, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                                                        <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-10 text-center">
                <Button size="lg" className="bg-black text-white hover:bg-gray-800 px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all">
                    포트폴리오 빌더 시작하기
                </Button>
            </div>
        </Card>
      </motion.div>
    </div>
  );
}
