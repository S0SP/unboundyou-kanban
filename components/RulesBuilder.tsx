'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/useStore';
import { PriorityRule } from '@/lib/priorityEngine';
import { Plus, Trash2, ToggleLeft, ToggleRight, Check } from 'lucide-react';
import { CustomSelect } from '@/components/CustomSelect';

export default function RulesBuilder() {
  const { rules, addRule, updateRule, deleteRule, ticketTypes, addTicketType, removeTicketType } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newTicketType, setNewTicketType] = useState('');

  // New Rule Form State
  const [name, setName] = useState('');
  const [targetField, setTargetField] = useState('estimated_value');
  const [operator, setOperator] = useState('greater_than');
  const [valueInput, setValueInput] = useState('');
  const [points, setPoints] = useState(10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Process type casting for value based on field type
    let finalVal: string | number = valueInput.trim();
    if (targetField === 'estimated_value' || targetField === 'days_since_last_contact' || targetField === 'days_to_session') {
      finalVal = Number(finalVal) || 0;
    }

    addRule({
      name: name.trim(),
      target_field: targetField,
      operator: operator as PriorityRule['operator'],
      value: finalVal,
      points: Number(points) || 0,
      is_active: true
    });

    // Reset Form
    setName('');
    setValueInput('');
    setPoints(10);
    setIsAdding(false);
  };

  const getOperatorSymbol = (op: PriorityRule['operator']) => {
    switch (op) {
      case 'equals': return 'is equal to';
      case 'not_equals': return 'is not equal to';
      case 'greater_than': return '>';
      case 'less_than': return '<';
      default: return op;
    }
  };

  const getFieldLabel = (field: string) => {
    switch (field) {
      case 'estimated_value': return 'Estimated Lead Value';
      case 'stage': return 'Kanban Stage';
      case 'ticket_type': return 'Ticket Type';
      case 'days_since_last_contact': return 'Days Since Last Contact';
      case 'days_to_session': return 'Days Until Session';
      default: return field;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Custom Ticket Types Panel */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Custom Ticket Types</h3>
          <p className="text-xs text-gray-400">Manage the available problem types for tickets across the application.</p>
        </div>
        
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (newTicketType.trim() && !ticketTypes.includes(newTicketType.trim())) {
              addTicketType(newTicketType.trim());
              setNewTicketType('');
            }
          }}
          className="flex gap-3"
        >
          <input 
            type="text" 
            value={newTicketType}
            onChange={(e) => setNewTicketType(e.target.value)}
            placeholder="e.g. Server Issue" 
            className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
          />
          <button 
            type="submit"
            disabled={!newTicketType.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white hover:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Plus size={14} />
            <span>Add Type</span>
          </button>
        </form>

        <div className="flex flex-wrap gap-2 pt-2">
          {ticketTypes.map(type => (
            <div key={type} className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
              <span className="text-sm font-semibold text-slate-700">{type}</span>
              <button 
                onClick={() => removeTicketType(type)}
                className="text-slate-400 hover:text-red-500 transition-colors"
                title="Remove type"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {ticketTypes.length === 0 && (
            <p className="text-sm text-gray-400 italic">No custom ticket types defined.</p>
          )}
        </div>
      </div>
      
      {/* Rule Builder Form Panel */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Custom Priority Rules</h3>
            <p className="text-xs text-gray-400">Configure weighting conditions to calculate lead priority scores automatically.</p>
          </div>
          {!isAdding && (
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <Plus size={14} />
              <span>Create Rule</span>
            </button>
          )}
        </div>

        {isAdding && (
          <form onSubmit={handleSubmit} className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl space-y-4">
            <h4 className="text-sm font-bold text-gray-800">Add Priority Engine Rule</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-semibold">Rule Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. High Value Lead" 
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                  required
                />
              </div>

              {/* Target Field */}
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-semibold">Lead/Ticket Attribute</label>
                <CustomSelect 
                  value={targetField}
                  onChange={(val) => {
                    setTargetField(val);
                    // Match default operator based on field types
                    if (val === 'stage' || val === 'ticket_type') {
                      setOperator('equals');
                    } else {
                      setOperator('greater_than');
                    }
                  }}
                  className="rounded-xl px-3 bg-white"
                  options={[
                    { label: "Estimated Value (₹)", value: "estimated_value" },
                    { label: "Kanban Stage", value: "stage" },
                    { label: "Ticket Type", value: "ticket_type" },
                    { label: "Days Since Last Contact", value: "days_since_last_contact" },
                    { label: "Days Until Session", value: "days_to_session" }
                  ]}
                />
              </div>

              {/* Operator */}
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-semibold">Comparison Operator</label>
                <CustomSelect 
                  value={operator}
                  onChange={(val) => setOperator(val)}
                  className="rounded-xl px-3 bg-white"
                  options={(targetField === 'stage' || targetField === 'ticket_type') ? [
                    { label: "Equals", value: "equals" },
                    { label: "Does Not Equal", value: "not_equals" }
                  ] : [
                    { label: "Is Greater Than (>)", value: "greater_than" },
                    { label: "Is Less Than (<)", value: "less_than" },
                    { label: "Equals (=)", value: "equals" }
                  ]}
                />
              </div>

              {/* Value */}
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-semibold">Matching Value</label>
                {targetField === 'ticket_type' ? (
                  <CustomSelect 
                    value={valueInput}
                    onChange={(val) => setValueInput(val)}
                    className="rounded-xl px-3 bg-white"
                    options={[
                      { label: "Select Ticket Type...", value: "" },
                      ...ticketTypes.map(t => ({ label: t, value: t }))
                    ]}
                  />
                ) : targetField === 'stage' ? (
                  <CustomSelect 
                    value={valueInput}
                    onChange={(val) => setValueInput(val)}
                    className="rounded-xl px-3 bg-white"
                    options={[
                      { label: "Select Stage...", value: "" },
                      { label: "New Leads", value: "New Leads" },
                      { label: "Contacted", value: "Contacted" },
                      { label: "Session Scheduled", value: "Session Scheduled" },
                      { label: "Session Completed", value: "Session Completed" },
                      { label: "Follow Up", value: "Follow Up" },
                      { label: "Interested", value: "Interested" },
                      { label: "Payment Pending", value: "Payment Pending" },
                      { label: "Converted", value: "Converted" },
                      { label: "Closed", value: "Closed" },
                      { label: "Dropped", value: "Dropped" }
                    ]}
                  />
                ) : (
                  <input 
                    type="text" 
                    value={valueInput}
                    onChange={(e) => setValueInput(e.target.value)}
                    placeholder={targetField === 'estimated_value' ? '50000' : 'e.g. 5'} 
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                    required
                  />
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              {/* Points weighting */}
              <div className="flex items-center gap-3">
                <div className="space-y-1 w-28">
                  <label className="text-xs text-gray-500 font-semibold">Score Modifier</label>
                  <input 
                    type="number" 
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    placeholder="10" 
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                    required
                  />
                </div>
                <span className="text-xs text-gray-400 mt-5">points added (e.g. +30) or subtracted (e.g. -15)</span>
              </div>

              {/* Form buttons */}
              <div className="flex gap-2 mt-5">
                <button 
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  Save Rule
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Rules list */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
        <h4 className="text-sm font-bold text-gray-800">Active Scoring Rules</h4>
        
        <div className="divide-y divide-gray-50">
          {rules.length > 0 ? (
            rules.map((rule) => (
              <div key={rule.id} className="py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-800 truncate">{rule.name}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      rule.points >= 0 ? 'bg-[#08BD7E]/10 text-[#08BD7E]' : 'bg-red-50 text-red-500'
                    }`}>
                      {rule.points >= 0 ? `+${rule.points}` : rule.points} pts
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    If <span className="font-semibold text-gray-600">{getFieldLabel(rule.target_field)}</span>{' '}
                    <span className="italic text-gray-500">{getOperatorSymbol(rule.operator)}</span>{' '}
                    <span className="font-bold text-gray-700">
                      {rule.target_field === 'estimated_value' ? `₹${rule.value.toLocaleString('en-IN')}` : String(rule.value)}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Active Toggle */}
                  <button 
                    onClick={() => updateRule(rule.id, { is_active: !rule.is_active })}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {rule.is_active ? (
                      <ToggleRight size={32} className="text-primary" />
                    ) : (
                      <ToggleLeft size={32} className="text-gray-300" />
                    )}
                  </button>

                  {/* Delete Rule */}
                  <button 
                    onClick={() => deleteRule(rule.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-gray-400 text-sm">
              No priority scoring rules configured. All leads will default to Medium priority.
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
