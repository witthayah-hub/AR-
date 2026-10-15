export type SkillId = 'inside_foot' | 'instep' | 'knee' | 'head';

export interface RubricLevel {
  grade: 4 | 3 | 2 | 1;
  labelTh: string;
  labelEn: string;
  descriptionTh: string;
  descriptionEn: string;
}

export interface TakrawSkill {
  id: SkillId;
  titleTh: string;
  titleEn: string;
  subtitle: string;
  contactPointTh: string;
  contactPointEn: string;
  primaryBodyPart: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  targetAngles: {
    name: string;
    targetRange: string;
    description: string;
  }[];
  rubric: {
    grade4: string;
    grade3: string;
    grade2: string;
    grade1: string;
  };
  keyTechniques: string[];
  commonMistakes: string[];
  cultureTip: string;
}

export interface PoseAnalysisResult {
  detected: boolean;
  score: 1 | 2 | 3 | 4;
  scorePercent: number; // 0 - 100
  statusTextTh: string;
  statusTextEn: string;
  statusType: 'success' | 'warning' | 'error' | 'idle';
  angles: {
    rightKnee?: number;
    leftKnee?: number;
    rightHip?: number;
    leftHip?: number;
    torsoAngle?: number;
    headAngle?: number;
    legElevationDiff?: number;
  };
  feedbackSuggestions: string[];
  strikeZoneActive: boolean;
  contactPointMet: boolean;
}

export interface SessionStats {
  repsCompleted: number;
  repsBySkill: Record<SkillId, number>;
  bestStreak: number;
  currentStreak: number;
  gradeCounts: {
    grade4: number;
    grade3: number;
    grade2: number;
    grade1: number;
  };
  startTime: number;
}
