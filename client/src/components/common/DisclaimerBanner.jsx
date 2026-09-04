import React from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';

export const DisclaimerBanner = ({ type = 'medical', className = '' }) => {
  if (type === 'medical') {
    return (
      <div className={`p-3.5 rounded-2xl bg-dark-900/80 border border-dark-700/80 text-xs text-slate-400 flex items-start gap-3 ${className}`}>
        <AlertCircle className="w-4 h-4 text-brand-amber shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-300 font-semibold">Non-Medical Disclaimer:</strong> ApexPulse AI generates athletic conditioning recommendations and statistical strength benchmarking based on self-reported metrics. This platform does not provide medical diagnoses or physical therapy. Consult a licensed physician before beginning intensive resistance training, especially if managing preexisting cardiovascular, musculoskeletal, or prenatal conditions.
        </p>
      </div>
    );
  }

  return (
    <div className={`p-3.5 rounded-2xl bg-dark-900/80 border border-dark-700/80 text-xs text-slate-400 flex items-start gap-3 ${className}`}>
      <ShieldCheck className="w-4 h-4 text-brand-cyan shrink-0 mt-0.5" />
      <p className="leading-relaxed">
        <strong className="text-slate-300 font-semibold">Data Calibration & Limitations:</strong> Percentile calculations are interpolated from published empirical strength standards (ExRx / Kilgore & Rippetoe powerlifting matrices adjusted with IPF masters age regression curves). Rankings reflect reference cohort distributions and should be used as progress benchmarks rather than clinical or competitive standards.
      </p>
    </div>
  );
};
