import { motion } from "framer-motion";
import { 
  Brain, 
  HeartPulse, 
  Hammer, 
  Users2, 
  TrendingUp, 
  Sparkles, 
  Star,
  LucideIcon 
} from "lucide-react";

export type MissionType = 'Mind' | 'Body' | 'Craft' | 'Relationships' | 'Finance' | 'Spirit' | 'Custom';

interface MissionIconConfig {
  icon: LucideIcon;
  color: string;
}

const missionIconMap: Record<MissionType, MissionIconConfig> = {
  Mind: { icon: Brain, color: '#91A7FF' },
  Body: { icon: HeartPulse, color: '#6DD47E' },
  Craft: { icon: Hammer, color: '#FFB347' },
  Relationships: { icon: Users2, color: '#F27878' },
  Finance: { icon: TrendingUp, color: '#9C88FF' },
  Spirit: { icon: Sparkles, color: '#F6C90E' },
  Custom: { icon: Star, color: '#999999' },
};

interface MissionIconProps {
  type: MissionType;
  size?: number;
  className?: string;
  animate?: boolean;
}

export const MissionIcon = ({ 
  type, 
  size = 24, 
  className = "",
  animate = true 
}: MissionIconProps) => {
  const config = missionIconMap[type];
  const Icon = config.icon;

  const iconElement = (
    <Icon 
      size={size} 
      color={config.color}
      className={className}
    />
  );

  if (!animate) {
    return iconElement;
  }

  return (
    <motion.div
      whileHover={{ 
        scale: 1.1,
        rotate: 5,
      }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 10 
      }}
      className="inline-flex items-center justify-center"
    >
      {iconElement}
    </motion.div>
  );
};

export const getMissionIconConfig = (type: MissionType) => missionIconMap[type];
