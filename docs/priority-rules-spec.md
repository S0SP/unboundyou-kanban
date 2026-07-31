# User-Defined Priority Engine Specification

Instead of hardcoding the priority levels (Low, Medium, High, Critical), this application uses a dynamic priority engine where rules are managed directly by administrative users via a simple Rule Builder interface.

## How It Works

1. **Rule Configuration**: Admins configure rules stored in the `priority_rules` table. Each rule evaluates a property of a `lead` or `ticket` and adds/subtracts points.
2. **Evaluation Trigger**: Whenever a `lead` or `ticket` is created or modified, the rule engine is executed.
3. **Score Calculation**: 
   - Start with a base score of `0`.
   - Evaluate each active rule. If a rule evaluates to true, add its `points` to the total score.
4. **Priority Mapping**: The final score determines the priority level:
   - **Score >= 90**: `Critical`
   - **Score 70 to 89**: `High`
   - **Score 40 to 69**: `Medium`
   - **Score < 40**: `Low`

---

## TypeScript Evaluation Engine

Here is the exact TypeScript logic for evaluating these rules on the server/client:

```typescript
export interface PriorityRule {
  id: string;
  name: string;
  target_field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'is_in';
  value: any;
  points: number;
  is_active: boolean;
}

export interface EvaluationContext {
  estimated_value: number;
  stage: string;
  ticket_type: string;
  days_since_last_contact: number;
  days_to_session: number; // days until next meeting
}

export function evaluateRule(rule: PriorityRule, context: EvaluationContext): boolean {
  const fieldValue = context[rule.target_field as keyof EvaluationContext];
  
  if (fieldValue === undefined || fieldValue === null) {
    return false;
  }

  const ruleValue = rule.value;

  switch (rule.operator) {
    case 'equals':
      return String(fieldValue).toLowerCase() === String(ruleValue).toLowerCase();
      
    case 'not_equals':
      return String(fieldValue).toLowerCase() !== String(ruleValue).toLowerCase();
      
    case 'greater_than':
      return Number(fieldValue) > Number(ruleValue);
      
    case 'less_than':
      return Number(fieldValue) < Number(ruleValue);
      
    case 'contains':
      if (typeof fieldValue === 'string') {
        return fieldValue.toLowerCase().includes(String(ruleValue).toLowerCase());
      }
      return false;
      
    case 'is_in':
      if (Array.isArray(ruleValue)) {
        return ruleValue.map(v => String(v).toLowerCase()).includes(String(fieldValue).toLowerCase());
      }
      return false;
      
    default:
      return false;
  }
}

export function calculatePriority(rules: PriorityRule[], context: EvaluationContext) {
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
```

---

## Dynamic UI Rule Builder Design

The Settings page should feature a clean, intuitive rule editor UI. It needs to look like a premium tool (similar to Linear or Vercel's settings).

### Visual Layout
- **List View**: A clean list of all current rules. Displays the Rule Name, the human-readable explanation (e.g., *"If Estimated Value is greater than ₹50,000 → +40 points"*), and a quick toggle to activate/deactivate.
- **Rule Modal / Form**:
  - **Rule Name**: Text Input (e.g., "High-Value Rescheduling")
  - **Condition Builder**:
    - **Field Dropdown**: `Estimated Value`, `Current Stage`, `Ticket Type`, `Days Since Last Contact`, `Days to Session`.
    - **Operator Dropdown**: matches field type (e.g., numbers get `>`, `<`, `=`; strings/enums get `is in`, `equals`).
    - **Value Input**: Number field, text field, or multi-select dropdown based on the selected field.
  - **Points Modifier**: Number Input (allows positive values like `+30` or negative like `-15`).

### Example Rule Combinations
1. **Rule**: "High-value ticket"
   - Field: `estimated_value`
   - Operator: `greater_than`
   - Value: `50000`
   - Points: `+40`
2. **Rule**: "Session Tomorrow Urgency"
   - Field: `days_to_session`
   - Operator: `equals`
   - Value: `1`
   - Points: `+25`
3. **Rule**: "Rescheduling Request"
   - Field: `ticket_type`
   - Operator: `equals`
   - Value: `"Rescheduling"`
   - Points: `+10`
4. **Rule**: "Payment Pending Stage"
   - Field: `stage`
   - Operator: `equals`
   - Value: `"Payment Pending"`
   - Points: `+35`
