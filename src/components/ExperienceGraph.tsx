import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Experience, ExperienceRelationship } from '../types';

interface ExperienceGraphProps {
  experiences: Experience[];
  relationships: ExperienceRelationship[];
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  category: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  reason: string;
}

export function ExperienceGraph({ experiences, relationships }: ExperienceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || experiences.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = 400;

    const nodes: Node[] = experiences.map(e => ({
      id: e.id,
      title: e.title,
      category: e.category
    }));

    if (nodes.length === 0) return;

    const links: Link[] = relationships.map(r => ({
      source: r.sourceId,
      target: r.targetId,
      reason: r.reason
    })).filter(l => 
      nodes.some(n => n.id === l.source) && nodes.some(n => n.id === l.target)
    );

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const simulation = d3.forceSimulation<Node>(nodes)
      .force("link", d3.forceLink<Node, Link>(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50));

    const link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 2);

    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<SVGGElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    const colors: Record<string, string> = {
      '대외활동': '#6366f1',
      '공모전': '#10b981',
      '아르바이트': '#f59e0b',
      '교내활동': '#3b82f6',
      '성적': '#ec4899'
    };

    node.append("circle")
      .attr("r", 8)
      .attr("fill", d => colors[d.category] || "#94a3b8");

    node.append("text")
      .text(d => d.title)
      .attr("x", 12)
      .attr("y", 4)
      .style("font-size", "10px")
      .style("font-weight", "500")
      .style("fill", "#334155");

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as Node).x!)
        .attr("y1", d => (d.source as Node).y!)
        .attr("x2", d => (d.target as Node).x!)
        .attr("y2", d => (d.target as Node).y!);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [experiences, relationships]);

  return (
    <div className="w-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10">
        <h4 className="text-sm font-bold text-slate-700">경험 연결망 (Graph RAG)</h4>
        <p className="text-[10px] text-slate-500">경험들 사이의 숨겨진 관계를 시각화합니다.</p>
      </div>
      <svg ref={svgRef} className="w-full h-[400px]" />
    </div>
  );
}
