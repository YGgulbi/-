import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { X, Save, HelpCircle, Plus, Trash2, TrendingUp } from 'lucide-react';
import { Button, Input, Textarea } from './ui/common';
import { Experience, UserProfile } from '../types';
import { v4 as uuidv4 } from 'uuid';
import * as d3 from 'd3';

interface LifeGraphProps {
  userProfile: UserProfile;
  onComplete: (experiences: Experience[]) => void;
  onClose: () => void;
}

interface LifeEvent {
  id: string;
  age: number;
  satisfaction: number; // -10 to 10
  title: string;
  description: string;
}

export function LifeGraph({ userProfile, onComplete, onClose }: LifeGraphProps) {
  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const birthYear = parseInt(userProfile.birthYear) || 2000;
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthYear;
  
  // Graph dimensions
  const margin = { top: 20, right: 30, bottom: 30, left: 40 };

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Scales
  const xScale = useMemo(() => {
    return d3.scaleLinear()
      .domain([0, currentAge + 1])
      .range([margin.left, 0]); 
  }, [currentAge, margin.left]);

  const yScale = useMemo(() => {
    return d3.scaleLinear()
      .domain([-10, 10])
      .range([0, 0]); 
  }, []);

  // Update graph on resize and data change
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || dimensions.width === 0) return;

    const { width, height } = dimensions;

    xScale.range([margin.left, width - margin.right]);
    yScale.range([height - margin.bottom, margin.top]);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    // Draw grid lines
    const xAxis = d3.axisBottom(xScale).ticks(Math.min(currentAge, 20));
    const yAxis = d3.axisLeft(yScale).ticks(5);

    // X-axis
    svg.append("g")
      .attr("transform", `translate(0,${yScale(0)})`) // Center axis
      .attr("class", "text-gray-300")
      .call(xAxis)
      .call(g => g.select(".domain").attr("stroke", "#cbd5e1").attr("stroke-width", 2))
      .call(g => g.selectAll("line").attr("stroke", "#e2e8f0"));

    // Y-axis
    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .attr("class", "text-gray-300")
      .call(yAxis)
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll("line").attr("stroke", "#e2e8f0").attr("stroke-dasharray", "2,2"));

    // Draw line connecting events
    if (events.length > 0) {
      const sortedEvents = [...events].sort((a, b) => a.age - b.age);
      
      // Add start point (birth) if not present
      const lineData = [
        { age: 0, satisfaction: 0 },
        ...sortedEvents
      ];

      const line = d3.line<any>()
        .x(d => xScale(d.age))
        .y(d => yScale(d.satisfaction))
        .curve(d3.curveMonotoneX);

      svg.append("path")
        .datum(lineData)
        .attr("fill", "none")
        .attr("stroke", "#6366f1")
        .attr("stroke-width", 3)
        .attr("d", line);
        
      // Area under the curve
      const area = d3.area<any>()
        .x(d => xScale(d.age))
        .y0(yScale(0))
        .y1(d => yScale(d.satisfaction))
        .curve(d3.curveMonotoneX);

      svg.append("path")
        .datum(lineData)
        .attr("fill", "url(#gradient)")
        .attr("opacity", 0.2)
        .attr("d", area);
        
      // Define gradient
      const defs = svg.append("defs");
      const gradient = defs.append("linearGradient")
        .attr("id", "gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");
      
      gradient.append("stop").attr("offset", "0%").attr("stop-color", "#6366f1");
      gradient.append("stop").attr("offset", "100%").attr("stop-color", "#ffffff");
    }

    // Draw points
    svg.selectAll("circle")
      .data(events)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.age))
      .attr("cy", d => yScale(d.satisfaction))
      .attr("r", 8)
      .attr("fill", d => d.id === selectedEventId ? "#4f46e5" : "#fff")
      .attr("stroke", "#4f46e5")
      .attr("stroke-width", 3)
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedEventId(d.id);
      });

    // Click on background to add point
    svg.on("click", (event) => {
      const [x, y] = d3.pointer(event);
      const age = Math.round(xScale.invert(x));
      const satisfaction = Math.round(yScale.invert(y));
      
      if (age < 0 || age > currentAge) return;

      const newEvent: LifeEvent = {
        id: uuidv4(),
        age,
        satisfaction: Math.max(-10, Math.min(10, satisfaction)),
        title: '',
        description: ''
      };
      
      setEvents(prev => [...prev, newEvent]);
      setSelectedEventId(newEvent.id);
    });

  }, [events, selectedEventId, currentAge, xScale, yScale, margin, dimensions]);

  const handleSave = () => {
    const newExperiences: Experience[] = events.map(event => {
        const year = birthYear + event.age;
        // Map satisfaction (-10 to 10) to (1 to 10) roughly
        // -10 -> 1, 0 -> 5, 10 -> 10
        const mappedSatisfaction = Math.round((event.satisfaction + 10) / 2) || 1;
        
        return {
            id: uuidv4(),
            title: event.title || `${year}년의 기억`,
            startDate: `${year}.01.01`,
            endDate: `${year}.12.31`,
            description: event.description || '인생 그래프에서 추가된 경험입니다.',
            category: '기타',
            satisfaction: Math.max(1, Math.min(10, mappedSatisfaction)),
            emotion: event.satisfaction > 0 ? '즐거움' : (event.satisfaction < 0 ? '두려움' : '익숙함'),
            tags: ['인생그래프'],
            attachments: []
        };
    });
    onComplete(newExperiences);
  };

  const updateSelectedEvent = (field: keyof LifeEvent, value: any) => {
    if (!selectedEventId) return;
    setEvents(prev => prev.map(e => e.id === selectedEventId ? { ...e, [field]: value } : e));
  };

  const deleteSelectedEvent = () => {
    if (!selectedEventId) return;
    setEvents(prev => prev.filter(e => e.id !== selectedEventId));
    setSelectedEventId(null);
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="text-indigo-600" />
              인생 굴곡 그래프
            </h2>
            <p className="text-gray-500 mt-1 text-sm">
              나의 인생을 그래프로 그려보세요. 클릭하여 점을 찍고, 그때의 기억을 기록하면 됩니다.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Graph Area */}
          <div className="flex-1 bg-slate-50 p-4 relative" ref={containerRef}>
            <svg ref={svgRef} className="w-full h-full cursor-crosshair shadow-inner bg-white rounded-xl border border-gray-200" />
            
            {events.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center text-gray-400 bg-white/80 p-6 rounded-xl backdrop-blur-sm border border-gray-200 shadow-sm">
                        <Plus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="font-medium">그래프 위를 클릭하여<br/>인생의 변곡점을 추가해보세요!</p>
                    </div>
                </div>
            )}
          </div>

          {/* Sidebar / Editor */}
          <div className="w-full md:w-96 bg-white border-l border-gray-200 p-6 overflow-y-auto flex flex-col">
            {selectedEvent ? (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">
                        {selectedEvent.age}세의 기억
                    </h3>
                    <Button variant="ghost" size="sm" onClick={deleteSelectedEvent} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 size={16} />
                    </Button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">만족도 ({selectedEvent.satisfaction})</label>
                        <input 
                            type="range" 
                            min="-10" 
                            max="10" 
                            value={selectedEvent.satisfaction} 
                            onChange={(e) => updateSelectedEvent('satisfaction', parseInt(e.target.value))}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>최악(-10)</span>
                            <span>최고(+10)</span>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">제목</label>
                        <Input 
                            value={selectedEvent.title} 
                            onChange={(e) => updateSelectedEvent('title', e.target.value)}
                            placeholder="예: 대학 입학, 첫 해외여행"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">설명</label>
                        <Textarea 
                            value={selectedEvent.description} 
                            onChange={(e) => updateSelectedEvent('description', e.target.value)}
                            placeholder="그때 어떤 일이 있었나요?"
                            className="h-32 resize-none"
                        />
                    </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 space-y-4">
                <HelpCircle size={48} className="opacity-20" />
                <p>그래프에서 점을 선택하면<br/>상세 내용을 입력할 수 있습니다.</p>
              </div>
            )}
            
            <div className="mt-auto pt-6 border-t border-gray-100">
                <Button 
                    onClick={handleSave} 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                    disabled={events.length === 0}
                >
                    <Save className="w-4 h-4 mr-2" />
                    {events.length}개의 경험 저장하기
                </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
