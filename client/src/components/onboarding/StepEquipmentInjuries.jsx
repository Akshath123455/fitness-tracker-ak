import React from 'react';
import { Dumbbell, ShieldAlert, HeartPulse, Check } from 'lucide-react';

export const StepEquipmentInjuries = ({ formData, updateFormData }) => {
  const equipmentOptions = [
    { id: 'full_gym', title: 'Commercial / Full Gym', desc: 'Barbells, squat racks, dumbbells up to 50kg+, cables & plate-loaded machines' },
    { id: 'home_gym', title: 'Garage / Home Gym', desc: 'Barbell, squat stand/rack, flat bench, plates, pull-up bar' },
    { id: 'dumbbells_bands', title: 'Dumbbells & Bands Only', desc: 'Adjustable dumbbells, resistance bands, bodyweight setup' },
    { id: 'bodyweight_only', title: 'Calisthenics / Bodyweight Only', desc: 'Pull-up bar, dip station, parallettes, floor space' },
  ];

  const injuryList = [
    { id: 'lower_back', label: 'Lower Back / Lumbar Strain' },
    { id: 'shoulder', label: 'Shoulder Impingement / Rotator Cuff' },
    { id: 'knee', label: 'Knee Patellar / Meniscus Sensitivity' },
    { id: 'wrist', label: 'Wrist / Forearm Pain' },
    { id: 'hip', label: 'Hip Impingement / Labral Tightness' },
    { id: 'neck', label: 'Cervical / Upper Trap Strain' },
    { id: 'elbow', label: 'Elbow Tendinopathy' },
  ];

  const specialPopulations = [
    { id: 'general', label: 'Standard Adult (No restrictions)' },
    { id: 'prenatal', label: 'Prenatal (Safe core & neutral spine)' },
    { id: 'postpartum', label: 'Postpartum (Pelvic floor & diastasis safe)' },
    { id: 'older_adult', label: 'Masters / Older Adult (Joint longevity)' },
    { id: 'rehab', label: 'Active Physical Therapy / Rehab' },
  ];

  const toggleInjury = (id) => {
    const current = formData.healthFlags.injuries || [];
    const exists = current.includes(id);
    const updated = exists ? current.filter((item) => item !== id) : [...current, id];
    updateFormData('healthFlags', {
      ...formData.healthFlags,
      injuries: updated,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-brand-emerald" />
          <span>Equipment & Physical Limitations</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Our substitution engine automatically filters out contraindicated exercises and tailors to your gear.
        </p>
      </div>

      {/* Equipment Access */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-2">
          Available Training Equipment <span className="text-brand-emerald">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {equipmentOptions.map((eq) => {
            const isSelected = formData.equipment.access === eq.id;
            return (
              <button
                key={eq.id}
                type="button"
                onClick={() =>
                  updateFormData('equipment', {
                    ...formData.equipment,
                    access: eq.id,
                  })
                }
                className={`p-3.5 text-left rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-brand-emerald/10 border-brand-emerald text-white'
                    : 'bg-dark-850 border-dark-700/80 text-slate-300 hover:border-dark-600'
                }`}
              >
                <span className={`text-xs font-bold block mb-1 ${isSelected ? 'text-brand-emerald' : 'text-slate-200'}`}>
                  {eq.title}
                </span>
                <p className="text-[11px] text-slate-400 leading-snug">{eq.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Injury Flags */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-brand-rose" />
          <span>Injury or Limitation Flags (Select any that apply)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {injuryList.map((inj) => {
            const isSelected = (formData.healthFlags.injuries || []).includes(inj.id);
            return (
              <button
                key={inj.id}
                type="button"
                onClick={() => toggleInjury(inj.id)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-rose-500/15 border-rose-500/50 text-rose-300 font-semibold'
                    : 'bg-dark-850 border-dark-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                    isSelected ? 'bg-rose-500 border-rose-500 text-white' : 'border-slate-600'
                  }`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5" />}
                </div>
                <span>{inj.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Special Population */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
          <HeartPulse className="w-4 h-4 text-brand-cyan" />
          <span>Special Population Profile</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {specialPopulations.map((pop) => {
            const isSelected = formData.healthFlags.specialPopulation === pop.id;
            return (
              <button
                key={pop.id}
                type="button"
                onClick={() =>
                  updateFormData('healthFlags', {
                    ...formData.healthFlags,
                    specialPopulation: pop.id,
                  })
                }
                className={`p-2.5 text-left rounded-xl text-xs border transition-all ${
                  isSelected
                    ? 'bg-brand-cyan/15 border-brand-cyan text-brand-cyan font-bold'
                    : 'bg-dark-850 border-dark-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {pop.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
