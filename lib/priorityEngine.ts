export interface PriorityRule {
  id: string;
  name: string;
  target_field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than';
  value: string | number;
  points: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EvaluationContext {
  estimated_value: number;
  stage: string;
  ticket_type: string;
  days_since_last_contact: number;
  days_to_session: number; // Days until next session/meeting
}

export function evaluateRule(rule: PriorityRule, context: EvaluationContext): boolean {
  const fieldValue = context[rule.target_field as keyof EvaluationContext];
  
  if (fieldValue === undefined || fieldValue === null) {
    return false;
  }

  const ruleValue = rule.value;

  switch (rule.operator) {
    case 'equals':
      return String(fieldValue).toLowerCase().trim() === String(ruleValue).toLowerCase().trim();
      
    case 'not_equals':
      return String(fieldValue).toLowerCase().trim() !== String(ruleValue).toLowerCase().trim();
      
    case 'greater_than':
      return Number(fieldValue) > Number(ruleValue);
      
    case 'less_than':
      return Number(fieldValue) < Number(ruleValue);
      
    default:
      return false;
  }
}

export function calculatePriority(rules: PriorityRule[], context: EvaluationContext): { score: number; level: 'Critical' | 'High' | 'Medium' | 'Low' } {
  let score = 0;
  
  for (const rule of rules) {
    if (rule.is_active && evaluateRule(rule, context)) {
      score += rule.points;
    }
  }

  let level: 'Critical' | 'High' | 'Medium' | 'Low' = 'Medium';
  if (score >= 90) level = 'Critical';
  else if (score >= 70) level = 'High';
  else if (score >= 40) level = 'Medium';
  else level = 'Low';

  return { score, level };
}
