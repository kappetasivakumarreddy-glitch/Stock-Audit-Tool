import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuditStore } from '../store/auditStore';
import { FilePlus2, ChevronLeft } from 'lucide-react';
import { ScreenGuide } from '../components/ScreenGuide';

interface AuditMetadataForm {
  clientName: string;
  auditName: string;
  auditDate: string;
  branchUnit: string;
  auditorName: string;
}

export const NewAudit: React.FC = () => {
  const { createAudit, setTab } = useAuditStore();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuditMetadataForm>({
    defaultValues: {
      clientName: '',
      auditName: 'Annual Physical Verification',
      auditDate: new Date().toISOString().slice(0, 10),
      branchUnit: 'Main Branch',
      auditorName: '',
    },
  });

  const onSubmit = async (data: AuditMetadataForm) => {
    try {
      await createAudit(data);
    } catch (err) {
      console.error(err);
    }
  };

  const guideSteps = [
    "Identify the Client / Entity name undergoing physical stock verification.",
    "Detail the Audit Description (e.g., Bank Stock Audit, Annual Review) and check the date.",
    "Input the Branch Name / Warehouse Unit coordinates representing this session.",
    "Enter the Lead Auditor or Firm name to append to the final verification workbook.",
    "Click 'Initialize Audit Session' to proceed to the Excel file importer."
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Back button */}
      <div className="flex flex-col gap-4">
        <div>
          <button
            onClick={() => setTab('dashboard')}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
        <ScreenGuide title="New Audit Initialization" steps={guideSteps} guideKey="new_audit" />
      </div>

      <div className="bg-slate-800 border border-slate-700/80 rounded-xl p-6 md:p-8 shadow-xl space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-700">
          <div className="p-2.5 bg-teal-600/10 text-teal-400 rounded-lg">
            <FilePlus2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100">Create New Audit Session</h3>
            <p className="text-xs text-slate-400 mt-0.5">Define metadata for the verification session.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Client Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Client / Entity Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              {...register('clientName', { required: 'Client name is required' })}
              placeholder="e.g. Acme Corporation Private Limited"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-650"
            />
            {errors.clientName && (
              <span className="text-red-400 text-xs font-medium">{errors.clientName.message}</span>
            )}
          </div>

          {/* Audit Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Audit Name / Description <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              {...register('auditName', { required: 'Audit name/description is required' })}
              placeholder="e.g. FY 2025-26 Bank Stock Audit"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-650"
            />
            {errors.auditName && (
              <span className="text-red-400 text-xs font-medium">{errors.auditName.message}</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Audit Date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Verification Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                {...register('auditDate', { required: 'Verification date is required' })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              {errors.auditDate && (
                <span className="text-red-400 text-xs font-medium">{errors.auditDate.message}</span>
              )}
            </div>

            {/* Branch Unit */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Branch / Warehouse Unit <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                {...register('branchUnit', { required: 'Branch name is required' })}
                placeholder="e.g. Unit 3 Warehouse, Noida"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-650"
              />
              {errors.branchUnit && (
                <span className="text-red-400 text-xs font-medium">{errors.branchUnit.message}</span>
              )}
            </div>
          </div>

          {/* Auditor Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Lead Auditor Name / Firm <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              {...register('auditorName', { required: 'Auditor name is required' })}
              placeholder="e.g. CA Nitin Sharma / N. Sharma & Associates"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-650"
            />
            {errors.auditorName && (
              <span className="text-red-400 text-xs font-medium">{errors.auditorName.message}</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-750">
            <button
              type="button"
              onClick={() => setTab('dashboard')}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-400 hover:bg-slate-700/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              Initialize Audit Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
