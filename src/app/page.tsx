"use client";

import { useState, useEffect } from 'react';
import { Timeline } from '../components/Timeline';
import { AnalysisView } from '../components/AnalysisView';
import { ProfileSetup } from '../components/ProfileSetup';
import { Experience, AnalysisResult, UserProfile } from '../types';
import { analyzeExperiences } from '../services/analysis';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [view, setView] = useState<'onboarding' | 'timeline' | 'analysis'>('onboarding');
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('userProfile');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      return typeof parsed === 'object' && parsed !== null ? parsed : null;
    } catch (e) {
      return null;
    }
  });

  const [experiences, setExperiences] = useState<Experience[]>(() => {
    try {
      const saved = localStorage.getItem('experiences');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });
  
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
      if (view === 'onboarding') {
        setView('timeline');
      }
    }
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('experiences', JSON.stringify(experiences));
  }, [experiences]);

  const handleProfileComplete = (profile: UserProfile, suggestedExperiences: Experience[] = []) => {
    setUserProfile(profile);
    if (suggestedExperiences.length > 0) {
      setExperiences(prev => [...prev, ...suggestedExperiences]);
      alert(`${suggestedExperiences.length}개의 추천 경험이 추가되었습니다. 내용을 수정하여 나만의 이야기로 만들어보세요!`);
    }
    setView('timeline');
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeExperiences(experiences);
      setAnalysisResult(result);
      setView('analysis');
    } catch (error) {
      alert('분석에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    if (confirm('모든 데이터가 초기화됩니다. 정말 처음으로 돌아가시겠습니까?')) {
      localStorage.removeItem('userProfile');
      localStorage.removeItem('experiences');
      setUserProfile(null);
      setExperiences([]);
      setAnalysisResult(null);
      setView('onboarding');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#FDFCF8]/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => userProfile && setView('timeline')}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
              Me
            </div>
            <span className="font-bold text-xl tracking-tight">자아발견 연구소</span>
          </div>
          {userProfile && (
            <nav className="flex gap-6 text-sm font-medium text-gray-500 items-center">
              <span className="text-gray-900 hidden md:inline">{userProfile.name}님</span>
              <button onClick={handleReset} className="text-xs text-gray-400 hover:text-red-500">초기화</button>
            </nav>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {view === 'onboarding' && (
          <ProfileSetup onComplete={handleProfileComplete} />
        )}

        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-12 h-12 text-indigo-600" />
            </motion.div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-gray-900">나의 DNA를 분석 중입니다...</h3>
              <p className="text-gray-500">경험들 사이의 숨겨진 연결고리를 찾고 있어요.</p>
            </div>
          </div>
        )}

        {!isAnalyzing && view === 'timeline' && userProfile && (
          <Timeline 
            userProfile={userProfile}
            experiences={experiences} 
            setExperiences={setExperiences} 
            onAnalyze={handleAnalyze} 
          />
        )}

        {!isAnalyzing && view === 'analysis' && analysisResult && (
          <AnalysisView 
            result={analysisResult} 
            experiences={experiences}
            onBack={() => setView('timeline')} 
          />
        )}
      </main>
    </div>
  );
}
