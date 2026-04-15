import React from 'react';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import './StepGuide.css';

export default function StepGuide({ steps, currentStep, title }) {
  return (
    <div className="step-guide">
      <div className="step-guide-header">
        <span className="step-guide-icon">📌</span>
        <h4 className="step-guide-title">{title || 'Steps to Follow'}</h4>
      </div>
      <div className="step-list">
        {steps.map((s, idx) => {
          const isCompleted = idx < (currentStep || 0);
          const isCurrent = idx === (currentStep || 0);
          return (
            <div key={idx} className={`step-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
              <div className="step-indicator">
                {isCompleted ? (
                  <CheckCircle2 size={18} className="step-check" />
                ) : (
                  <div className="step-number">{s.step}</div>
                )}
                {idx < steps.length - 1 && <div className="step-line" />}
              </div>
              <div className="step-content">
                <div className="step-title-row">
                  <span className="step-title">{s.title}</span>
                  {isCurrent && <ArrowRight size={14} className="step-arrow" />}
                </div>
                <p className="step-desc">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
