import React, { useState, useMemo, useRef } from 'react';
import { Experience, UserProfile, Attachment } from '../types';
import { Button, Input, Label, Textarea, Card } from './ui/common';
import { Plus, Trash2, Zap, Edit2, RotateCcw, X, Upload, FileText, Loader2, Paperclip, Map as MapIcon, List, Sparkles, MapPin, TrendingUp } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { parseExperienceFromFile, parseExperiencesFromFile } from '../services/parser';
import { ExperienceGraph } from './ExperienceGraph';
import { ExperienceCardPicker, SituationCard } from './ExperienceCardPicker';
import { MemoryMilestoneGuide } from './MemoryMilestoneGuide';
import { LifeGraph } from './LifeGraph';

interface TimelineProps {
  userProfile: UserProfile;
  experiences: Experience[];
  setExperiences: React.Dispatch<React.SetStateAction<Experience[]>>;
  onAnalyze: () => void;
}

export function Timeline({ userProfile, experiences, setExperiences, onAnalyze }: TimelineProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingYear, setAddingYear] = useState<number | null>(null);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isCardPickerOpen, setIsCardPickerOpen] = useState(false);
  const [isMilestoneOpen, setIsMilestoneOpen] = useState(false);
  const [isLifeGraphOpen, setIsLifeGraphOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const globalFileInputRef = useRef<HTMLInputElement>(null);

  const [newExp, setNewExp] = useState<Partial<Experience>>({
    title: '',
    startDate: '',
    endDate: '',
    description: '',
    category: '대외활동',
    satisfaction: 5,
    emotion: '즐거움',
    tags: [],
    attachments: [],
  });

  const [customCategory, setCustomCategory] = useState('');
  const [customEmotion, setCustomEmotion] = useState('');

  const predefinedCategories = ['대외활동', '공모전', '아르바이트', '교내활동', '성적'];
  const predefinedEmotions = ['즐거움', '당황', '두려움', '익숙함'];

  const guides = [
    "💡 막막하다면, 가장 최근에 '즐거웠다'고 느낀 순간부터 적어보세요!",
    "💡 대학 입학 후 첫 방학 때 무엇을 했는지 떠올려보세요.",
    "💡 누군가에게 칭찬받았던 기억이 있나요?",
    "💡 밤새워도 피곤하지 않았던 활동이 있었나요?",
    "💡 정말 하기 싫었지만 억지로 해야 했던 일은 무엇인가요?",
  ];

  const [randomGuide, setRandomGuide] = useState(guides[0]);

  const birthYear = parseInt(userProfile?.birthYear || '2000') || 2000;
  const currentYear = new Date().getFullYear();
  
  // Create array of years from current back to birth
  const years = useMemo(() => {
    const length = Math.max(1, currentYear - birthYear + 1);
    return Array.from({ length }, (_, i) => currentYear - i);
  }, [currentYear, birthYear]);

  // Helper to parse date string safely
  const parseDate = (dateStr: string) => {
    if (!dateStr || typeof dateStr !== 'string') return new Date();
    // Handle YYYY.MM.DD
    const normalized = dateStr.replace(/\./g, '-');
    const date = new Date(normalized);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  // Filter active experiences
  const activeExperiences = useMemo(() => experiences.filter(e => !e.deletedAt), [experiences]);
  
  // Filter deleted experiences
  const deletedExperiences = useMemo(() => experiences.filter(e => e.deletedAt).sort((a, b) => 
    new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime()
  ), [experiences]);

  // Group experiences by year (using startDate)
  const experiencesByYear = useMemo(() => {
    const grouped: Record<number, Experience[]> = {};
    activeExperiences.forEach(exp => {
      // Handle migration or missing dates gracefully
      const dateStr = exp.startDate || (exp as any).date || new Date().toISOString();
      const year = parseDate(dateStr).getFullYear();
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(exp);
    });
    // Sort within years by startDate desc
    Object.keys(grouped).forEach(year => {
      grouped[parseInt(year)].sort((a, b) => {
        const dateA = a.startDate || (a as any).date;
        const dateB = b.startDate || (b as any).date;
        return parseDate(dateB).getTime() - parseDate(dateA).getTime();
      });
    });
    return grouped;
  }, [activeExperiences]);

  const startAdding = (year?: number) => {
    setEditingId(null);
    setAddingYear(year || null);
    const defaultDate = year ? `${year}.01.01` : new Date().toISOString().split('T')[0].replace(/-/g, '.');
    setNewExp({
      title: '',
      startDate: defaultDate,
      endDate: defaultDate,
      description: '',
      category: '대외활동',
      satisfaction: 5,
      emotion: '즐거움',
      tags: [],
      attachments: [],
    });
    setCustomCategory('');
    setCustomEmotion('');
    setRandomGuide(guides[Math.floor(Math.random() * guides.length)]);
  };

  const startEditing = (exp: Experience) => {
    setEditingId(exp.id);
    const year = parseDate(exp.startDate).getFullYear();
    setAddingYear(year);
    
    const isCustomCat = !predefinedCategories.includes(exp.category);
    const isCustomEmo = !predefinedEmotions.includes(exp.emotion);

    setNewExp({ 
      ...exp,
      startDate: exp.startDate.replace(/-/g, '.'),
      endDate: exp.endDate.replace(/-/g, '.'),
      category: isCustomCat ? 'custom' : exp.category,
      emotion: isCustomEmo ? 'custom' : exp.emotion,
      attachments: exp.attachments || [],
    });

    if (isCustomCat) setCustomCategory(exp.category);
    if (isCustomEmo) setCustomEmotion(exp.emotion);
  };

  const cancelAdding = () => {
    setAddingYear(null);
    setEditingId(null);
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    // Allow only numbers and dots
    const cleaned = value.replace(/[^0-9.]/g, '');
    setNewExp(prev => ({ ...prev, [field]: cleaned }));
  };

  const handleGlobalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Set parsing state
    setIsParsing(true);

    try {
      const parsedDataList = await parseExperiencesFromFile(file);
      
      if (parsedDataList.length === 0) {
        alert('파일에서 경험을 찾을 수 없습니다.');
        return;
      }

      // Prepare attachment if file is small enough
      let attachment: Attachment | undefined;
      if (file.size < 10 * 1024 * 1024) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        attachment = {
          id: uuidv4(),
          name: file.name,
          type: file.type,
          data: base64,
        };
      }

      const newExperiences: Experience[] = parsedDataList.map((data: any) => ({
        id: uuidv4(),
        title: data.title || '제목 없음',
        startDate: data.startDate || new Date().toISOString().split('T')[0].replace(/-/g, '.'),
        endDate: data.endDate || data.startDate || new Date().toISOString().split('T')[0].replace(/-/g, '.'),
        description: data.description || '',
        category: data.category || '대외활동',
        satisfaction: 5,
        emotion: '즐거움',
        tags: [],
        attachments: attachment ? [attachment] : [],
        energyLevel: 5
      }));

      setExperiences(prev => [...prev, ...newExperiences]);
      alert(`${newExperiences.length}개의 경험이 추가되었습니다!`);

    } catch (error) {
      console.error(error);
      alert('파일 분석에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsParsing(false);
      if (globalFileInputRef.current) globalFileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const parsedData = await parseExperienceFromFile(file);
      
      setNewExp(prev => ({
        ...prev,
        title: parsedData.title || prev.title,
        startDate: parsedData.startDate || prev.startDate,
        endDate: parsedData.endDate || prev.endDate,
        description: parsedData.description || prev.description,
        category: parsedData.category || prev.category,
      }));

      // Also attach the file automatically if it's small enough (< 10MB)
      if (file.size < 10 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = () => {
          const attachment: Attachment = {
            id: uuidv4(),
            name: file.name,
            type: file.type,
            data: reader.result as string,
          };
          setNewExp(prev => ({
            ...prev,
            attachments: [...(prev.attachments || []), attachment]
          }));
        };
        reader.readAsDataURL(file);
      }

    } catch (error) {
      alert('파일 분석에 실패했습니다. 직접 입력해주세요.');
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const attachment: Attachment = {
        id: uuidv4(),
        name: file.name,
        type: file.type,
        data: reader.result as string,
      };
      setNewExp(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), attachment]
      }));
    };
    reader.readAsDataURL(file);
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setNewExp(prev => ({
      ...prev,
      attachments: prev.attachments?.filter(a => a.id !== id)
    }));
  };

  const handleSave = () => {
    if (!newExp.title || !newExp.description) return;
    
    // Ensure dates are in YYYY.MM.DD format for consistency
    const startDate = newExp.startDate || new Date().toISOString().split('T')[0].replace(/-/g, '.');
    const endDate = newExp.endDate || startDate;

    const finalCategory = newExp.category === 'custom' ? customCategory : newExp.category!;
    const finalEmotion = newExp.emotion === 'custom' ? customEmotion : newExp.emotion!;

    if (editingId) {
      // Update existing
      setExperiences(prev => prev.map(e => 
        e.id === editingId 
        ? { 
            ...e, 
            ...newExp, 
            startDate, 
            endDate,
            category: finalCategory,
            emotion: finalEmotion,
            satisfaction: newExp.satisfaction || 5,
            attachments: newExp.attachments || [],
          } as Experience
        : e
      ));
    } else {
      // Create new
      const experience: Experience = {
        id: uuidv4(),
        title: newExp.title!,
        startDate,
        endDate,
        description: newExp.description!,
        category: finalCategory,
        emotion: finalEmotion,
        satisfaction: newExp.satisfaction || 5,
        tags: newExp.tags || [],
        energyLevel: newExp.satisfaction || 5, // Fallback for legacy code
        attachments: newExp.attachments || [],
      };
      setExperiences(prev => [...prev, experience]);
    }
    cancelAdding();
  };

  const handleDelete = (id: string) => {
    setExperiences(prev => prev.map(e => 
      e.id === id ? { ...e, deletedAt: new Date().toISOString() } : e
    ));
  };

  const handleRestore = (id: string) => {
    setExperiences(prev => prev.map(e => 
      e.id === id ? { ...e, deletedAt: undefined } : e
    ));
  };

  const handlePermanentDelete = (id: string) => {
    if (confirm('영구적으로 삭제하시겠습니까? 복구할 수 없습니다.')) {
      setExperiences(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleCardsSelected = (selectedCards: SituationCard[]) => {
    const newExperiences: Experience[] = selectedCards.map(card => ({
      id: uuidv4(),
      title: card.title,
      startDate: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      endDate: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      description: `${card.question}\n\n(이때의 상황과 나의 역할을 자세히 적어보세요!)`,
      category: card.category,
      satisfaction: 5,
      emotion: card.emotion,
      tags: [],
      attachments: [],
      energyLevel: 5
    }));
    
    setExperiences(prev => [...prev, ...newExperiences]);
    setIsCardPickerOpen(false);
  };

  const handleMilestonesComplete = (newExperiences: Experience[]) => {
    if (newExperiences.length > 0) {
      setExperiences(prev => [...prev, ...newExperiences]);
    }
    setIsMilestoneOpen(false);
  };

  const handleLifeGraphComplete = (newExperiences: Experience[]) => {
    if (newExperiences.length > 0) {
      setExperiences(prev => [...prev, ...newExperiences]);
    }
    setIsLifeGraphOpen(false);
  };

  const renderForm = () => (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden mb-6"
    >
      <Card className="p-6 bg-white border-2 border-indigo-100 shadow-lg relative overflow-hidden">
        {/* Helper Banner */}
        {!editingId && (
          <div className="bg-indigo-50 text-indigo-700 px-4 py-2 -mx-6 -mt-6 mb-4 text-sm font-medium flex items-center justify-between">
              <span>{randomGuide}</span>
              <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept=".pdf,.jpg,.jpeg,.png,.txt"
                  onChange={handleFileUpload}
                />
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 h-8"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isParsing}
                >
                  {isParsing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
                  {isParsing ? '분석 중...' : '파일로 자동 입력'}
                </Button>
              </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg text-indigo-900">
              {editingId ? '경험 수정하기' : (addingYear ? `${addingYear}년 경험 추가` : '새로운 경험 추가')}
            </h3>
            <button onClick={cancelAdding} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
          
            <div className="space-y-2">
              <Label>제목</Label>
              <Input
                value={newExp.title}
                onChange={e => setNewExp({ ...newExp, title: e.target.value })}
                placeholder="예: 동아리 자선 행사 기획"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>기간</Label>
              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                    <span className="text-xs font-medium text-gray-500 mb-1.5 block">시작일</span>
                    <Input
                        type="text"
                        value={newExp.startDate}
                        onChange={e => handleDateChange('startDate', e.target.value)}
                        placeholder="YYYY.MM.DD"
                        maxLength={10}
                        className="w-full font-mono"
                    />
                </div>
                <div className="relative">
                    <span className="absolute -left-3 top-1/2 -translate-y-1/2 text-gray-400 hidden sm:block">~</span>
                    <span className="text-xs font-medium text-gray-500 mb-1.5 block">종료일</span>
                    <Input
                        type="text"
                        value={newExp.endDate}
                        onChange={e => handleDateChange('endDate', e.target.value)}
                        placeholder="YYYY.MM.DD"
                        maxLength={10}
                        className="w-full font-mono"
                    />
                </div>
              </div>
            </div>

          <div className="space-y-2">
            <Label>설명</Label>
            <Textarea
              value={newExp.description}
              onChange={e => setNewExp({ ...newExp, description: e.target.value })}
              placeholder="어떤 일이 있었나요? 어떤 감정을 느꼈나요? 나의 역할은 무엇이었나요?"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>카테고리</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newExp.category}
                onChange={e => setNewExp({ ...newExp, category: e.target.value as any })}
              >
                {predefinedCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="custom">직접 입력</option>
              </select>
              {newExp.category === 'custom' && (
                <Input
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  placeholder="카테고리 직접 입력"
                  className="mt-2"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>성취 만족도 (1-10)</Label>
              <div className="flex items-center gap-4">
                  <Input
                  type="range"
                  min="1"
                  max="10"
                  value={newExp.satisfaction}
                  onChange={e => setNewExp({ ...newExp, satisfaction: parseInt(e.target.value) })}
                  className="flex-1"
                  />
                  <span className="font-mono font-bold w-8 text-center text-indigo-600">{newExp.satisfaction}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>감정</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newExp.emotion}
                    onChange={e => setNewExp({ ...newExp, emotion: e.target.value as any })}
                >
                    {predefinedEmotions.map(emo => (
                    <option key={emo} value={emo}>{emo}</option>
                    ))}
                    <option value="custom">직접 입력</option>
                </select>
                {newExp.emotion === 'custom' && (
                    <Input
                    value={customEmotion}
                    onChange={e => setCustomEmotion(e.target.value)}
                    placeholder="감정 직접 입력"
                    />
                )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>첨부파일</Label>
              <input 
                type="file" 
                ref={attachmentInputRef}
                className="hidden" 
                onChange={handleAttachmentUpload}
              />
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 text-xs text-indigo-600 hover:text-indigo-700"
                onClick={() => attachmentInputRef.current?.click()}
              >
                <Paperclip className="w-3 h-3 mr-1" /> 파일 추가
              </Button>
            </div>
            {newExp.attachments && newExp.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {newExp.attachments.map(att => (
                  <div key={att.id} className="flex items-center bg-gray-100 rounded-md px-2 py-1 text-xs text-gray-700 border border-gray-200">
                    <FileText className="w-3 h-3 mr-1 text-gray-500" />
                    <span className="max-w-[150px] truncate">{att.name}</span>
                    <button onClick={() => removeAttachment(att.id)} className="ml-2 text-gray-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={cancelAdding}>취소</Button>
            <Button onClick={handleSave}>{editingId ? '수정 완료' : '저장하기'}</Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-20 z-40">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {userProfile.name}님의 인생 지도
          </h2>
          <p className="text-gray-500 mt-1 text-sm">빈 칸을 클릭하거나 파일을 업로드하여 나의 이야기를 채워보세요.</p>
        </div>
        <div className="flex gap-3 items-center">
            <div className="flex bg-gray-100 p-1 rounded-lg mr-2">
                <button 
                    onClick={() => setViewMode('list')}
                    className={cn(
                        "p-1.5 rounded-md transition-all",
                        viewMode === 'list' ? "bg-white shadow-sm text-indigo-600" : "text-gray-400 hover:text-gray-600"
                    )}
                >
                    <List size={18} />
                </button>
                <button 
                    onClick={() => setViewMode('map')}
                    className={cn(
                        "p-1.5 rounded-md transition-all",
                        viewMode === 'map' ? "bg-white shadow-sm text-indigo-600" : "text-gray-400 hover:text-gray-600"
                    )}
                >
                    <MapIcon size={18} />
                </button>
            </div>
            <Button 
                onClick={() => setIsTrashOpen(true)} 
                variant="outline" 
                className="text-gray-500 border-gray-200 hover:text-red-500 hover:border-red-200"
            >
                <Trash2 size={16} className="mr-2" />
                휴지통 ({deletedExperiences.length})
            </Button>
            {activeExperiences.length > 0 && (
                <Button onClick={onAnalyze} variant="secondary" className="shadow-md hover:shadow-lg transition-all">
                    나의 DNA 분석하기
                </Button>
            )}
        </div>
      </div>

      {viewMode === 'map' ? (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
        >
            <ExperienceGraph experiences={activeExperiences} relationships={[]} />
            <div className="text-center p-8 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-indigo-700 font-medium">분석을 완료하면 경험들 사이의 관계가 나타납니다.</p>
                <Button onClick={onAnalyze} variant="primary" className="mt-4">분석 시작하기</Button>
            </div>
        </motion.div>
      ) : (
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 -translate-x-1/2 hidden md:block" />
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 -translate-x-1/2 md:hidden" />

          <div className="space-y-8">
              {/* Global Add Form */}
              <AnimatePresence>
                  {addingYear === null && editingId === null && (
                      <div key="global-add-buttons" className="flex flex-wrap justify-center mb-8 gap-4 relative z-10">
                           <Button onClick={() => startAdding()} variant="primary" className="rounded-full shadow-lg px-6">
                              <Plus className="w-4 h-4 mr-2" /> 새로운 경험 기록하기
                           </Button>
                           
                           <Button onClick={() => setIsCardPickerOpen(true)} variant="outline" className="rounded-full shadow-lg px-6 bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 transition-all">
                              <Sparkles className="w-4 h-4 mr-2" /> 이런 적 있어? (카드 뽑기)
                           </Button>

                           <Button onClick={() => setIsMilestoneOpen(true)} variant="outline" className="rounded-full shadow-lg px-6 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 transition-all">
                              <MapPin className="w-4 h-4 mr-2" /> 기억의 이정표 (가이드)
                           </Button>

                           <Button onClick={() => setIsLifeGraphOpen(true)} variant="outline" className="rounded-full shadow-lg px-6 bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 transition-all">
                              <TrendingUp className="w-4 h-4 mr-2" /> 인생 굴곡 그래프 (그리기)
                           </Button>

                           <input 
                              type="file" 
                              ref={globalFileInputRef}
                              className="hidden" 
                              accept=".pdf,.jpg,.jpeg,.png,.txt"
                              onChange={handleGlobalFileUpload}
                           />
                           <Button 
                              onClick={() => globalFileInputRef.current?.click()} 
                              variant="outline" 
                              className={cn(
                                "rounded-full shadow-lg px-6 bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50 transition-all",
                                isParsing && "opacity-70 cursor-not-allowed"
                              )}
                              disabled={isParsing}
                           >
                              {isParsing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                              {isParsing ? 'Gemini가 분석 중...' : '파일로 인생지도 자동 완성'}
                           </Button>
                      </div>
                  )}
              </AnimatePresence>
              
            {years.map((year) => {
            const age = year - birthYear + 1;
            const yearExperiences = experiencesByYear[year] || [];
            const isFormOpen = addingYear === year;

            return (
              <div key={year} className="relative grid grid-cols-[4rem_1fr] md:grid-cols-[1fr_4rem_1fr] gap-4 md:gap-0 items-start group">
                
                {/* Left Side (Desktop: Content or Empty) */}
                <div className="hidden md:block pr-8 text-right">
                  {yearExperiences.map((exp, i) => (
                      i % 2 === 0 && (
                        <ExperienceCard 
                          key={exp.id} 
                          exp={exp} 
                          onDelete={handleDelete} 
                          onEdit={startEditing}
                        />
                      )
                  ))}
                </div>

                {/* Center Marker */}
                <div className="flex flex-col items-center justify-start h-full relative">
                    <div className={`w-16 h-16 rounded-full border-4 flex flex-col items-center justify-center z-10 transition-colors ${
                        yearExperiences.length > 0 ? 'bg-indigo-600 border-indigo-100 text-white' : 'bg-white border-gray-200 text-gray-400 group-hover:border-indigo-300 group-hover:text-indigo-500'
                    }`}>
                        <span className="text-xs font-bold">{year}</span>
                        <span className="text-[10px] opacity-80">{age}세</span>
                    </div>
                </div>

                {/* Right Side (Desktop: Content or Empty, Mobile: All Content) */}
                <div className="pl-4 md:pl-8">
                    {/* Mobile: Show all. Desktop: Show odd indexed items */}
                    <div className="md:hidden space-y-4 mb-4">
                        {yearExperiences.map((exp) => (
                            <ExperienceCard 
                              key={exp.id} 
                              exp={exp} 
                              onDelete={handleDelete} 
                              onEdit={startEditing}
                            />
                        ))}
                    </div>
                    <div className="hidden md:block space-y-4 mb-4">
                        {yearExperiences.map((exp, i) => (
                            i % 2 !== 0 && (
                                <ExperienceCard 
                                  key={exp.id} 
                                  exp={exp} 
                                  onDelete={handleDelete} 
                                  onEdit={startEditing}
                                />
                            )
                        ))}
                    </div>

                    {/* Add Button / Form Area */}
                    <div className="min-h-[2rem]">
                        <AnimatePresence mode="wait">
                            {isFormOpen ? (
                                <div key={`form-${year}`}>{renderForm()}</div>
                            ) : (
                                <button 
                                    key={`add-btn-${year}`}
                                    onClick={() => startAdding(year)}
                                    className={`text-sm flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                                        yearExperiences.length === 0 
                                        ? 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 border border-dashed border-gray-300 hover:border-indigo-300 w-full md:w-auto justify-center md:justify-start' 
                                        : 'text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100'
                                    }`}
                                >
                                    <Plus size={14} /> 
                                    {yearExperiences.length === 0 ? '이 시기의 경험 추가하기' : '추가하기'}
                                </button>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}
      
      {/* Parsing Overlay */}
      <AnimatePresence>
        {isParsing && (
            <motion.div 
                key="parsing-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center"
            >
                <div className="relative">
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="w-32 h-32 border-4 border-indigo-100 border-t-indigo-600 rounded-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Zap className="w-12 h-12 text-indigo-600 animate-pulse" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mt-8">Gemini가 인생지도를 작성 중입니다</h3>
                <p className="text-gray-500 mt-2">파일 속 소중한 경험들을 하나하나 찾아내고 있어요...</p>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Trash Modal */}
      <AnimatePresence>
        {isTrashOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-lg flex items-center gap-2 text-gray-900">
                  <Trash2 size={20} className="text-gray-500" />
                  휴지통
                  <span className="text-sm font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                    {deletedExperiences.length}
                  </span>
                </h3>
                <button onClick={() => setIsTrashOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              
              <div className="overflow-y-auto p-4 space-y-3 flex-1">
                {deletedExperiences.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Trash2 size={48} className="mx-auto mb-3 opacity-20" />
                    <p>휴지통이 비어있습니다.</p>
                  </div>
                ) : (
                  deletedExperiences.map(exp => (
                    <div key={exp.id} className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center group hover:border-indigo-200 transition-colors">
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {exp.startDate}
                          </span>
                          <span className="text-xs text-gray-400">
                            삭제됨: {exp.deletedAt ? new Date(exp.deletedAt).toLocaleDateString() : '-'}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900 truncate">{exp.title}</h4>
                        <p className="text-sm text-gray-500 truncate">{exp.description}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleRestore(exp.id)}
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                        >
                          <RotateCcw size={14} className="mr-1" /> 복구
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handlePermanentDelete(exp.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <X size={14} className="mr-1" /> 영구 삭제
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
                <Button variant="ghost" onClick={() => setIsTrashOpen(false)}>닫기</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Life Graph Modal */}
      <AnimatePresence>
        {isLifeGraphOpen && (
          <LifeGraph 
            userProfile={userProfile} 
            onComplete={handleLifeGraphComplete} 
            onClose={() => setIsLifeGraphOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Card Picker Modal */}
      <AnimatePresence>
        {isCardPickerOpen && (
          <ExperienceCardPicker 
            onSelect={handleCardsSelected} 
            onClose={() => setIsCardPickerOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Milestone Guide Modal */}
      <AnimatePresence>
        {isMilestoneOpen && (
          <MemoryMilestoneGuide 
            onComplete={handleMilestonesComplete} 
            onClose={() => setIsMilestoneOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface ExperienceCardProps {
  exp: Experience;
  onDelete: (id: string) => void;
  onEdit: (exp: Experience) => void;
}

const ExperienceCard: React.FC<ExperienceCardProps> = ({ exp, onDelete, onEdit }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    // Handle migration for display
    const startDate = exp.startDate || (exp as any).date;
    const endDate = exp.endDate || startDate;
    const dateDisplay = startDate === endDate ? startDate : `${startDate} ~ ${endDate}`;
    
    // Fallback for legacy data
    const satisfaction = exp.satisfaction || (exp as any).energyLevel || 5;
    const emotion = exp.emotion || '기타';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-left"
        >
            <Card className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-indigo-500 relative group">
                <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{dateDisplay}</span>
                    <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10 relative">
                      {isDeleting ? (
                        <div className="flex items-center gap-1 bg-white shadow-sm rounded-md p-0.5 border border-red-100 absolute right-0 -top-1">
                            <span className="text-[10px] text-red-500 font-bold px-1 whitespace-nowrap">삭제?</span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(exp.id); }}
                                className="text-red-600 hover:bg-red-50 p-1 rounded"
                                aria-label="삭제 확인"
                            >
                                <span className="text-xs font-bold">네</span>
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsDeleting(false); }}
                                className="text-gray-500 hover:bg-gray-50 p-1 rounded"
                                aria-label="취소"
                            >
                                <span className="text-xs">아니오</span>
                            </button>
                        </div>
                      ) : (
                        <>
                          <button 
                              onClick={(e) => { e.stopPropagation(); onEdit(exp); }}
                              className="text-gray-400 hover:text-indigo-500 p-1"
                              aria-label="수정"
                          >
                              <Edit2 size={14} />
                          </button>
                          <button 
                              onClick={(e) => { e.stopPropagation(); setIsDeleting(true); }}
                              className="text-gray-400 hover:text-red-500 p-1"
                              aria-label="삭제"
                          >
                              <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                </div>
                <h4 className="font-bold text-gray-900 mb-1">{exp.title}</h4>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">{exp.description}</p>
                <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                        {exp.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {emotion}
                    </span>
                    <span className="flex items-center text-gray-500">
                        <Zap size={10} className="mr-0.5 text-yellow-500" /> {satisfaction}/10
                    </span>
                    {exp.attachments && exp.attachments.length > 0 && (
                      <span className="flex items-center text-gray-500 ml-1">
                        <Paperclip size={10} className="mr-0.5" /> {exp.attachments.length}
                      </span>
                    )}
                </div>
            </Card>
        </motion.div>
    )
}
