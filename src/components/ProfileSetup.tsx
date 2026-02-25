import React, { useState } from 'react';
import { UserProfile, Experience } from '../types';
import { Button, Input, Label, Card } from './ui/common';
import { motion, AnimatePresence } from 'motion/react';
import { suggestExperiences } from '../services/analysis';
import { Loader2, Check, Sparkles, X } from 'lucide-react';

interface ProfileSetupProps {
  onComplete: (profile: UserProfile, suggestedExperiences?: Experience[]) => void;
}

export function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const [step, setStep] = useState<'input' | 'loading' | 'selection'>('input');
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    birthYear: '',
    status: '',
    major: '',
    detailMajor: '',
    keywords: [],
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [suggestedExperiences, setSuggestedExperiences] = useState<Experience[]>([]);
  const [selectedExperienceIds, setSelectedExperienceIds] = useState<Set<string>>(new Set());

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      e.preventDefault();
      if (profile.keywords && profile.keywords.length >= 5) {
        alert('키워드는 최대 5개까지 입력 가능합니다.');
        return;
      }
      if (!profile.keywords?.includes(keywordInput.trim())) {
        setProfile(prev => ({
          ...prev,
          keywords: [...(prev.keywords || []), keywordInput.trim()]
        }));
      }
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setProfile(prev => ({
      ...prev,
      keywords: prev.keywords?.filter(k => k !== keyword)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile.name && profile.birthYear && profile.status) {
      setStep('loading');
      try {
        const suggestions = await suggestExperiences(profile);
        setSuggestedExperiences(suggestions);
        // Select all by default
        setSelectedExperienceIds(new Set(suggestions.map(s => s.id)));
        setStep('selection');
      } catch (error) {
        console.error(error);
        // Fallback if AI fails
        onComplete(profile, []);
      }
    }
  };

  const toggleExperience = (id: string) => {
    const newSet = new Set(selectedExperienceIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedExperienceIds(newSet);
  };

  const handleFinalComplete = () => {
    const selected = suggestedExperiences.filter(exp => selectedExperienceIds.has(exp.id));
    onComplete(profile, selected);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {step === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-lg"
          >
            <Card className="p-8 border-t-4 border-t-indigo-600 shadow-xl bg-white">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">자아발견 연구소에 오신 것을 환영합니다</h1>
                <p className="text-gray-600">나를 알아가는 여정을 시작하기 위해<br/>기본 정보를 입력해주세요.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">이름 (닉네임)</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      placeholder="홍길동"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthYear">출생년도</Label>
                    <select
                      id="birthYear"
                      value={profile.birthYear}
                      onChange={(e) => setProfile({ ...profile, birthYear: e.target.value })}
                      className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">선택해주세요</option>
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}년
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">현재 상태</Label>
                  <select
                    id="status"
                    value={profile.status}
                    onChange={(e) => setProfile({ ...profile, status: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">선택해주세요</option>
                    <option value="대학생">대학생</option>
                    <option value="취업준비생">취업준비생</option>
                    <option value="직장인">직장인</option>
                    <option value="프리랜서">프리랜서</option>
                    <option value="기타">기타</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="major">주요 전공 (선택)</Label>
                    <Input
                      id="major"
                      value={profile.major}
                      onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                      placeholder="예: 경영학과"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="detailMajor">세부 전공 (선택)</Label>
                    <Input
                      id="detailMajor"
                      value={profile.detailMajor}
                      onChange={(e) => setProfile({ ...profile, detailMajor: e.target.value })}
                      placeholder="예: 마케팅"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">나를 표현하는 키워드 (3개 이상 권장)</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {profile.keywords?.map((keyword) => (
                      <span key={keyword} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeKeyword(keyword)}
                          className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500 focus:outline-none"
                        >
                          <span className="sr-only">Remove {keyword}</span>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <Input
                    id="keywords"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                    placeholder="키워드 입력 후 Enter (예: 꼼꼼함, 리더십, 호기심)"
                  />
                  <p className="text-xs text-gray-500">엔터키를 눌러 키워드를 추가하세요.</p>
                </div>

                <Button type="submit" className="w-full py-6 text-lg mt-4" size="lg">
                  다음 단계로
                </Button>
              </form>
            </Card>
          </motion.div>
        )}

        {step === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center text-center space-y-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-16 h-16 text-indigo-600" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{profile.name}님의 데이터를 분석 중입니다...</h2>
              <p className="text-gray-500">전공과 키워드를 바탕으로<br/>있었을 법한 경험들을 찾고 있어요.</p>
            </div>
          </motion.div>
        )}

        {step === 'selection' && (
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl"
          >
            <Card className="p-8 border-t-4 border-t-emerald-500 shadow-xl bg-white max-h-[80vh] flex flex-col">
              <div className="text-center mb-6 shrink-0">
                <div className="flex justify-center mb-4">
                  <div className="bg-emerald-100 p-3 rounded-full">
                    <Sparkles className="w-8 h-8 text-emerald-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">이런 경험들이 있으신가요?</h2>
                <p className="text-gray-600">
                  AI가 제안한 경험 중 실제로 있었던 일을 선택해주세요.<br/>
                  <span className="text-emerald-600 font-medium">선택한 경험은 타임라인에 자동 추가되며, 나중에 수정할 수 있습니다.</span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto p-2 mb-6">
                {suggestedExperiences.map((exp) => (
                  <div
                    key={exp.id}
                    onClick={() => toggleExperience(exp.id)}
                    className={`cursor-pointer border-2 rounded-xl p-4 transition-all relative ${
                      selectedExperienceIds.has(exp.id)
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold px-2 py-1 rounded bg-white border border-gray-200 text-gray-600">
                        {exp.category}
                      </span>
                      {selectedExperienceIds.has(exp.id) && (
                        <div className="bg-emerald-500 text-white rounded-full p-1">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{exp.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{exp.description}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 shrink-0 pt-4 border-t border-gray-100">
                <Button 
                  variant="ghost" 
                  onClick={() => onComplete(profile, [])}
                  className="flex-1 text-gray-500"
                >
                  건너뛰기
                </Button>
                <Button 
                  onClick={handleFinalComplete} 
                  className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg"
                >
                  {selectedExperienceIds.size}개 선택하고 시작하기
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
