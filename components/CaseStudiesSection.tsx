'use client';

import { useState, useEffect, useRef } from 'react';
import { Snowflake, Zap, Wrench, Building2, ArrowRight, Link } from 'lucide-react';

interface TimelineItem {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
  status: 'completed' | 'in-progress' | 'pending';
  energy: number;
}

const caseStudiesData: TimelineItem[] = [
  {
    id: 1,
    title: 'Case Study #1: HVAC',
    date: '2024',
    content:
      'Local HVAC company automated their service calls, photo documentation, and invoicing. Reduced admin time by 15 hours/week and increased customer satisfaction with automated follow-ups.',
    category: 'HVAC',
    icon: Snowflake,
    relatedIds: [2, 4],
    status: 'completed',
    energy: 95,
  },
  {
    id: 2,
    title: 'Case Study #2: GC',
    date: '2024',
    content:
      'General contractor managing 5+ crews streamlined their proposal-to-payment pipeline. Now tracks 10+ employees and multiple projects from one dashboard, eliminating scattered sticky notes and texts.',
    category: 'General Contractor',
    icon: Building2,
    relatedIds: [1, 3],
    status: 'completed',
    energy: 88,
  },
  {
    id: 3,
    title: 'Case Study #3: Plumbing',
    date: '2024',
    content:
      'Plumbing business automated emergency call documentation and parts tracking. No more 2am panic about missing photos or warranty claims—everything is captured automatically.',
    category: 'Plumbing',
    icon: Wrench,
    relatedIds: [2, 4],
    status: 'in-progress',
    energy: 78,
  },
  {
    id: 4,
    title: 'Case Study #4: Electrical',
    date: '2024',
    content:
      'Electrical contractor solved their code compliance documentation nightmare. Every photo, change order, and safety doc is tracked and retrievable in seconds—saving thousands on disputed claims.',
    category: 'Electrical',
    icon: Zap,
    relatedIds: [1, 3],
    status: 'completed',
    energy: 92,
  },
];

export default function CaseStudiesSection() {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [centerOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Check for mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key) !== id) {
          newState[parseInt(key)] = false;
        }
      });

      newState[id] = !prev[id];

      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);

        const relatedItems = getRelatedItems(id);
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => {
          newPulseEffect[relId] = true;
        });
        setPulseEffect(newPulseEffect);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }

      return newState;
    });
  };

  useEffect(() => {
    let rotationTimer: NodeJS.Timeout;

    if (autoRotate) {
      rotationTimer = setInterval(() => {
        setRotationAngle((prev) => {
          const newAngle = (prev + 0.3) % 360;
          return Number(newAngle.toFixed(3));
        });
      }, 50);
    }

    return () => {
      if (rotationTimer) {
        clearInterval(rotationTimer);
      }
    };
  }, [autoRotate]);

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    // Smaller radius on mobile
    const radius = isMobile ? 120 : 200;
    const radian = (angle * Math.PI) / 180;

    const x = radius * Math.cos(radian) + centerOffset.x;
    const y = radius * Math.sin(radian) + centerOffset.y;

    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(0.4, Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2)));

    return { x, y, angle, zIndex, opacity, radian };
  };

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = caseStudiesData.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    const relatedItems = getRelatedItems(activeNodeId);
    return relatedItems.includes(itemId);
  };

  const getStatusStyles = (status: TimelineItem['status']): string => {
    switch (status) {
      case 'completed':
        return 'text-white bg-primary border-primary';
      case 'in-progress':
        return 'text-primary bg-white border-primary';
      case 'pending':
        return 'text-text-light bg-secondary border-text-light';
      default:
        return 'text-text-light bg-secondary border-text-light';
    }
  };

  return (
    <section className="relative min-h-screen bg-gradient-to-b from-secondary to-white py-20">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-text-dark md:text-4xl">
            Real Results from Real Businesses
          </h2>
          <p className="mx-auto max-w-2xl text-base md:text-lg text-text-light">
            See how other trades businesses are saving time and growing with our tools
          </p>
        </div>

        {/* Radial Orbital Timeline */}
        <div
          className="w-full h-[500px] md:h-[700px] flex flex-col items-center justify-center overflow-visible rounded-2xl bg-gradient-to-br from-primary/5 via-accent/5 to-secondary"
          ref={containerRef}
          onClick={handleContainerClick}
        >
          <div className="relative w-full max-w-4xl h-full flex items-center justify-center">
            <div
              className="absolute w-full h-full flex items-center justify-center"
              ref={orbitRef}
              style={{
                perspective: '1000px',
                transform: `translate(${centerOffset.x}px, ${centerOffset.y}px)`,
              }}
            >
              {/* Center Core */}
              <div className="absolute w-12 md:w-16 h-12 md:h-16 rounded-full bg-gradient-to-br from-primary to-accent animate-pulse flex items-center justify-center z-10">
                <div className="absolute w-16 md:w-20 h-16 md:h-20 rounded-full border border-primary/20 animate-ping opacity-70"></div>
                <div
                  className="absolute w-20 md:w-24 h-20 md:h-24 rounded-full border border-accent/10 animate-ping opacity-50"
                  style={{ animationDelay: '0.5s' }}
                ></div>
                <div className="w-6 md:w-8 h-6 md:h-8 rounded-full bg-white/80 backdrop-blur-md"></div>
              </div>

              {/* Orbit Ring */}
              <div className="absolute w-60 h-60 md:w-96 md:h-96 rounded-full border border-primary/10"></div>

              {/* Orbital Nodes */}
              {caseStudiesData.map((item, index) => {
                const position = calculateNodePosition(index, caseStudiesData.length);
                const isExpanded = expandedItems[item.id];
                const isRelated = isRelatedToActive(item.id);
                const isPulsing = pulseEffect[item.id];
                const Icon = item.icon;

                const nodeStyle = {
                  transform: `translate(${position.x}px, ${position.y}px)`,
                  zIndex: isExpanded ? 200 : position.zIndex,
                  opacity: isExpanded ? 1 : position.opacity,
                };

                return (
                  <div
                    key={item.id}
                    ref={(el) => {
                      nodeRefs.current[item.id] = el;
                    }}
                    className="absolute transition-all duration-700 cursor-pointer"
                    style={nodeStyle}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleItem(item.id);
                    }}
                  >
                    {/* Energy Glow */}
                    <div
                      className={`absolute rounded-full -inset-1 ${
                        isPulsing ? 'animate-pulse duration-1000' : ''
                      }`}
                      style={{
                        background: `radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0) 70%)`,
                        width: `${item.energy * 0.5 + 40}px`,
                        height: `${item.energy * 0.5 + 40}px`,
                        left: `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                        top: `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                      }}
                    ></div>

                    {/* Node Circle */}
                    <div
                      className={`
                      w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center
                      ${
                        isExpanded
                          ? 'bg-primary text-white'
                          : isRelated
                          ? 'bg-accent text-white'
                          : 'bg-white text-primary'
                      }
                      border-2
                      ${
                        isExpanded
                          ? 'border-primary shadow-lg shadow-primary/30'
                          : isRelated
                          ? 'border-accent animate-pulse'
                          : 'border-primary/40'
                      }
                      transition-all duration-300 transform
                      ${isExpanded ? 'scale-125 md:scale-150' : ''}
                    `}
                    >
                      <Icon size={14} className="md:w-4 md:h-4" />
                    </div>

                    {/* Node Label */}
                    <div
                      className={`
                      absolute top-10 md:top-12 left-1/2 -translate-x-1/2 whitespace-nowrap
                      text-[10px] md:text-xs font-semibold tracking-wider
                      transition-all duration-300
                      ${isExpanded ? 'opacity-0 md:opacity-100 text-text-dark scale-125' : 'text-text-light'}
                    `}
                    >
                      {item.title}
                    </div>

                    {/* Expanded Card */}
                    {isExpanded && (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 w-72 md:w-80 bg-white/95 backdrop-blur-lg border-2 border-primary/30 rounded-xl shadow-2xl shadow-primary/10 overflow-visible max-h-[400px] md:max-h-none overflow-y-auto"
                        style={{
                          // Position card above if node is in bottom half, below if in top half
                          top: position.radian > Math.PI / 2 && position.radian < (3 * Math.PI) / 2 ? 'auto' : '60px',
                          bottom:
                            position.radian > Math.PI / 2 && position.radian < (3 * Math.PI) / 2 ? '60px' : 'auto',
                        }}
                      >
                        <div
                          className="absolute left-1/2 -translate-x-1/2 w-px h-3 bg-primary/50"
                          style={{
                            top: position.radian > Math.PI / 2 && position.radian < (3 * Math.PI) / 2 ? 'auto' : '-3px',
                            bottom:
                              position.radian > Math.PI / 2 && position.radian < (3 * Math.PI) / 2 ? '-3px' : 'auto',
                          }}
                        ></div>

                        {/* Card Header */}
                        <div className="p-4 pb-2">
                          <div className="flex justify-between items-center">
                            <span
                              className={`px-3 py-1 text-xs font-semibold rounded-full border-2 ${getStatusStyles(
                                item.status
                              )}`}
                            >
                              {item.status === 'completed'
                                ? 'COMPLETE'
                                : item.status === 'in-progress'
                                ? 'IN PROGRESS'
                                : 'PENDING'}
                            </span>
                            <span className="text-xs font-mono text-text-light">{item.date}</span>
                          </div>
                          <h4 className="text-sm md:text-base font-bold mt-2 text-text-dark">
                            {item.title}
                          </h4>
                        </div>

                        {/* Card Content */}
                        <div className="px-4 pb-4 text-xs md:text-sm text-text-light">
                          <p>{item.content}</p>

                          {/* Energy Level */}
                          <div className="mt-4 pt-3 border-t border-secondary">
                            <div className="flex justify-between items-center text-xs mb-1">
                              <span className="flex items-center text-text-light">
                                <Zap size={10} className="mr-1" />
                                Success Rate
                              </span>
                              <span className="font-mono text-text-dark">{item.energy}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary to-accent"
                                style={{ width: `${item.energy}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Related Case Studies */}
                          {item.relatedIds.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-secondary">
                              <div className="flex items-center mb-2">
                                <Link size={10} className="text-text-light mr-1" />
                                <h4 className="text-xs uppercase tracking-wider font-medium text-text-light">
                                  Related Studies
                                </h4>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {item.relatedIds.map((relatedId) => {
                                  const relatedItem = caseStudiesData.find((i) => i.id === relatedId);
                                  return (
                                    <button
                                      key={relatedId}
                                      className="flex items-center h-6 px-2 py-0 text-xs border border-primary/30 bg-white hover:bg-primary/10 text-text-dark hover:text-primary transition-all rounded-md"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleItem(relatedId);
                                      }}
                                    >
                                      {relatedItem?.title}
                                      <ArrowRight size={8} className="ml-1 text-text-light" />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Instruction Text */}
        <p className="text-center mt-8 text-sm text-text-light">
          Click on any case study to explore details and connections
        </p>
      </div>
    </section>
  );
}
