import { PoseAnalysisResult, SkillId } from '../types/takraw';

export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

/**
 * Calculates angle between 3 points in degrees (vertex at B)
 */
export function calculateAngle(A: LandmarkPoint, B: LandmarkPoint, C: LandmarkPoint): number {
  if (!A || !B || !C) return 0;
  const radians = Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(A.y - B.y, A.x - B.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  return Math.round(angle);
}

/**
 * Calculates vertical inclination angle from vertical line
 */
export function calculateVerticalAngle(p1: LandmarkPoint, p2: LandmarkPoint): number {
  if (!p1 || !p2) return 0;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const radians = Math.atan2(Math.abs(dx), Math.abs(dy));
  return Math.round((radians * 180) / Math.PI);
}

/**
 * MediaPipe Pose Landmark Indices:
 * 0: nose
 * 11: left_shoulder, 12: right_shoulder
 * 23: left_hip, 24: right_hip
 * 25: left_knee, 26: right_knee
 * 27: left_ankle, 28: right_ankle
 * 31: left_foot_index, 32: right_foot_index
 */
export function evaluatePose(skillId: SkillId, landmarks: LandmarkPoint[]): PoseAnalysisResult {
  if (!landmarks || landmarks.length < 29) {
    return {
      detected: false,
      score: 1,
      scorePercent: 0,
      statusTextTh: 'ยังไม่พบนักกีฬาในกล้อง...',
      statusTextEn: 'No athlete detected in frame...',
      statusType: 'idle',
      angles: {},
      feedbackSuggestions: ['กรุณายืนถอยหลังให้เห็นทั้งตัวตั้งแต่ศีรษะถึงปลายเท้า'],
      strikeZoneActive: false,
      contactPointMet: false
    };
  }

  const nose = landmarks[0];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];
  const leftFoot = landmarks[31] || leftAnkle;
  const rightFoot = landmarks[32] || rightAnkle;

  // Calculate midpoints & base angles
  const midHip: LandmarkPoint = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2
  };
  const midShoulder: LandmarkPoint = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2
  };

  const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
  const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
  const rightHipAngle = calculateAngle(rightShoulder, rightHip, rightKnee);
  const leftHipAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
  const torsoAngle = calculateVerticalAngle(midHip, midShoulder);
  const headAngle = calculateVerticalAngle(midShoulder, nose);

  // Determine active kicking leg (the leg with higher foot/ankle elevation, lower y means higher on screen)
  const isRightLegKicking = rightAnkle.y < leftAnkle.y;
  const kickingAnkle = isRightLegKicking ? rightAnkle : leftAnkle;
  const kickingKnee = isRightLegKicking ? rightKnee : leftKnee;
  const supportKnee = isRightLegKicking ? leftKnee : rightKnee;
  const supportKneeAngle = isRightLegKicking ? leftKneeAngle : rightKneeAngle;
  const kickingHipAngle = isRightLegKicking ? rightHipAngle : leftHipAngle;
  const kickingKneeAngle = isRightLegKicking ? rightKneeAngle : leftKneeAngle;

  // Elevation difference: difference between foot height and support knee
  const footVsSupportKnee = supportKnee.y - kickingAnkle.y; // positive means foot is higher than support knee

  let score: 1 | 2 | 3 | 4 = 1;
  let scorePercent = 30;
  let statusTextTh = '';
  let statusTextEn = '';
  let statusType: 'success' | 'warning' | 'error' = 'warning';
  const feedbackSuggestions: string[] = [];
  let contactPointMet = false;

  switch (skillId) {
    case 'inside_foot': {
      // ข้างเท้าด้านใน (ลูกแป)
      // Criteria:
      // 1. Foot raised: kicking ankle elevated
      // 2. Ankle height should NOT exceed knee level too much (footVsSupportKnee between -0.15 and 0.08)
      // 3. Knee turnout: kicking knee bent (90-135 deg)
      // 4. Support knee flexed (135-168 deg)
      const isFootRaised = kickingAnkle.y < (isRightLegKicking ? leftAnkle.y : rightAnkle.y) - 0.08;
      const isKneeBent = kickingKneeAngle >= 85 && kickingKneeAngle <= 145;
      const isHeightGood = footVsSupportKnee >= -0.18 && footVsSupportKnee <= 0.12;
      const isSupportBent = supportKneeAngle < 172;

      if (!isFootRaised) {
        score = 1;
        scorePercent = 25;
        statusTextTh = 'เตรียมยกข้างเท้าด้านในขึ้น';
        statusTextEn = 'Prepare to lift inside foot';
        statusType = 'warning';
        feedbackSuggestions.push('ยกข้างเท้าข้างที่ถนัดขึ้น บิดเข่าออกด้านข้าง');
        feedbackSuggestions.push('ย่อเข่าขาหลักเล็กน้อยเพื่อทรงตัว');
      } else if (footVsSupportKnee > 0.12) {
        // Raised too high!
        score = 2;
        scorePercent = 55;
        statusTextTh = 'ยกเท้าสูงเกินระดับเข่า';
        statusTextEn = 'Foot lifted too high above knee';
        statusType = 'warning';
        feedbackSuggestions.push('จุดสัมผัสไม่ควรสูงเกินระดับหัวเข่าขาหลัก');
        feedbackSuggestions.push('กดระดับเท้าลงมาเล็กน้อยให้ขนานพื้น');
      } else if (isHeightGood && isKneeBent && isSupportBent) {
        score = 4;
        scorePercent = 95;
        statusTextTh = 'ยอดเยี่ยม! ท่าลูกแปถูกต้องระดับดีมาก';
        statusTextEn = 'Excellent! Perfect inside foot technique';
        statusType = 'success';
        contactPointMet = true;
        feedbackSuggestions.push('ข้างเท้าขนานพื้น จุดสัมผัสต่ำกว่าระดับเข่าสมบูรณ์แบบ');
        feedbackSuggestions.push('รักษาสมดุลและทรงตัวให้นิ่ง');
      } else if (isHeightGood) {
        score = 3;
        scorePercent = 75;
        statusTextTh = 'ดี: บิดเข่าออกด้านข้างอีกนิด';
        statusTextEn = 'Good: Rotate knee slightly wider outward';
        statusType = 'success';
        contactPointMet = true;
        feedbackSuggestions.push('บิดเข่าออกด้านข้างให้ข้างเท้าด้านในหงายขนานพื้นสนิท');
        if (!isSupportBent) feedbackSuggestions.push('ย่อเข่าขาหลักเพิ่มอีกนิดเพื่อความมั่นคง');
      } else {
        score = 2;
        scorePercent = 50;
        statusTextTh = 'พอใช้: ปรับมุมเข่าและข้างเท้า';
        statusTextEn = 'Fair: Adjust knee angle and arch';
        statusType = 'warning';
        feedbackSuggestions.push('ยกเท้าขึ้นมาให้ข้างเท้าขนานกับพื้น');
      }
      break;
    }

    case 'instep': {
      // ลูกหลังเท้า
      // Criteria:
      // 1. Foot reaching forward with ankle flexed upwards (toes curled slightly up)
      // 2. Both knees softened/bent
      // 3. Hip extension forward
      const isFootForward = kickingAnkle.y < (isRightLegKicking ? leftAnkle.y : rightAnkle.y) - 0.05;
      const isHipExtended = kickingHipAngle >= 120 && kickingHipAngle <= 165;
      const isKneesSoft = supportKneeAngle < 170;

      if (!isFootForward) {
        score = 1;
        scorePercent = 25;
        statusTextTh = 'เตรียมก้าวเท้าและกระดกปลายเท้า';
        statusTextEn = 'Step forward and point toes up';
        statusType = 'warning';
        feedbackSuggestions.push('ก้าวเท้าข้างถนัดไปข้างหน้า ย่อเข่าทั้งสองข้าง');
        feedbackSuggestions.push('กระดกปลายเท้าขึ้นเล็กน้อยขณะปะทะ');
      } else if (isHipExtended && isKneesSoft) {
        score = 4;
        scorePercent = 95;
        statusTextTh = 'ยอดเยี่ยม! หลังเท้ารองรับลูกสมบูรณ์';
        statusTextEn = 'Excellent! Instep strike angle is spot on';
        statusType = 'success';
        contactPointMet = true;
        feedbackSuggestions.push('ล็อคข้อเท้า สัมผัสโคนนิ้วชี้หลังเท้า ออกแรงส่งจากสะโพก');
        feedbackSuggestions.push('ลูกจะลอยขึ้นในแนวดิ่งอย่างนุ่มนวล');
      } else {
        score = 3;
        scorePercent = 75;
        statusTextTh = 'ดี: ย่อเข่าทั้งสองข้างเพิ่มอีกนิด';
        statusTextEn = 'Good: Soften both knees more';
        statusType = 'success';
        contactPointMet = true;
        feedbackSuggestions.push('ออกแรงส่งช้อนลูกจากสะโพก');
        feedbackSuggestions.push('ระวังอย่าวาดเท้าแรงเกินไป');
      }
      break;
    }

    case 'knee': {
      // ลูกเข่า (หน้าขา)
      // Criteria:
      // 1. Thigh horizontal: kicking hip angle ~ 85° - 105° (thigh parallel to ground)
      // 2. Knee bent down ~ 75° - 110° (shank dangling vertically)
      // 3. Torso upright (torsoAngle < 18°)
      const thighElevated = kickingHipAngle >= 75 && kickingHipAngle <= 115;
      const kneeFolded = kickingKneeAngle >= 65 && kickingKneeAngle <= 115;
      const torsoUpright = torsoAngle <= 20;

      if (kickingHipAngle > 125) {
        score = 1;
        scorePercent = 20;
        statusTextTh = 'ยกเข่าขึ้นมาให้ขนานกับพื้น';
        statusTextEn = 'Lift knee until thigh is parallel to floor';
        statusType = 'warning';
        feedbackSuggestions.push('ยกต้นขาข้างถนัดขึ้น ให้ขาท่อนบนขนานกับพื้น');
        feedbackSuggestions.push('ปลายเท้างอชี้ลงพื้น');
      } else if (thighElevated && kneeFolded && torsoUpright) {
        score = 4;
        scorePercent = 95;
        statusTextTh = 'ยอดเยี่ยม! ท่าลูกเข่าขนานพื้นระดับ 90 องศา';
        statusTextEn = 'Excellent! Thigh is perfectly horizontal';
        statusType = 'success';
        contactPointMet = true;
        feedbackSuggestions.push('ขาท่อนบนขนานพื้น สัมผัสหน้าขาเหนือเข่า');
        feedbackSuggestions.push('ลำตัวตั้งตรง ทรงตัวได้อย่างสง่างาม');
      } else if (thighElevated) {
        score = 3;
        scorePercent = 78;
        statusTextTh = 'ดี: ปล่อยปลายเท้าทิ้งดิ่งลง';
        statusTextEn = 'Good: Let shank hang downwards';
        statusType = 'success';
        contactPointMet = true;
        feedbackSuggestions.push('ระวังอย่าให้ปลายเท้ากระดกขึ้น ปล่อยขาท่อนล่างชี้ลง');
        if (!torsoUpright) feedbackSuggestions.push('อย่าเอนลำตัวไปข้างหลังมากเกินไป');
      } else {
        score = 2;
        scorePercent = 50;
        statusTextTh = 'พอใช้: ยกต้นขาขึ้นสูงอีกนิด';
        statusTextEn = 'Fair: Lift knee slightly higher';
        statusType = 'warning';
        feedbackSuggestions.push('ขาท่อนบนยังไม่ขนานพื้น ยกข้อสะโพกขึ้นอีก');
      }
      break;
    }

    case 'head': {
      // ลูกศีรษะ (โหม่ง)
      // Criteria:
      // 1. Head tilted upwards (around 45 degrees)
      // 2. Torso reclined slightly (8° - 25°)
      // 3. Knees spring ready (both knees bent 130° - 165°)
      const isHeadTilted = headAngle >= 15 && headAngle <= 65;
      const isTorsoReclined = torsoAngle >= 6 && torsoAngle <= 28;
      const isLegsBent = rightKneeAngle < 168 && leftKneeAngle < 168;

      if (!isHeadTilted && !isTorsoReclined) {
        score = 2;
        scorePercent = 45;
        statusTextTh = 'เตรียมเอนตัวและเงยหน้า 45 องศา';
        statusTextEn = 'Recline body slightly and look up at 45°';
        statusType = 'warning';
        feedbackSuggestions.push('เอนลำตัวไปข้างหลังเล็กน้อย เงยหน้ามองลูก');
        feedbackSuggestions.push('เล็งจุดปะทะที่ตีนผมกึ่งกลางหน้าผาก');
      } else if (isHeadTilted && isTorsoReclined && isLegsBent) {
        score = 4;
        scorePercent = 95;
        statusTextTh = 'ยอดเยี่ยม! ท่าเตรียมโหม่งพร้อมสปริงตัว';
        statusTextEn = 'Excellent! Ready for perfect header';
        statusType = 'success';
        contactPointMet = true;
        feedbackSuggestions.push('เงยหน้า 45 องศา สัมผัสบริเวณตีนผม');
        feedbackSuggestions.push('ลืมตามองลูก สปริงตัวจากปลายเท้าส่งแรง');
      } else {
        score = 3;
        scorePercent = 75;
        statusTextTh = 'ดี: เงยหน้าและย่อเข่าส่งแรง';
        statusTextEn = 'Good: Tilt head and spring from knees';
        statusType = 'success';
        contactPointMet = true;
        feedbackSuggestions.push('เกร็งกล้ามเนื้อคอ สัมผัสด้วยหน้าผากส่วนแข็ง');
        feedbackSuggestions.push('ห้ามหลับตาขณะลูกตกกระทบ');
      }
      break;
    }
  }

  return {
    detected: true,
    score,
    scorePercent,
    statusTextTh,
    statusTextEn,
    statusType,
    angles: {
      rightKnee: rightKneeAngle,
      leftKnee: leftKneeAngle,
      rightHip: rightHipAngle,
      leftHip: leftHipAngle,
      torsoAngle,
      headAngle,
      legElevationDiff: Math.round(footVsSupportKnee * 100)
    },
    feedbackSuggestions,
    strikeZoneActive: true,
    contactPointMet
  };
}
