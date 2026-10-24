import React, { useState } from 'react';
import { useHardwareStore } from '../../context/HardwareStoreContext';
import { Layers, Plus, X, CheckCircle } from 'lucide-react';

interface NewCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated?: (categoryName: string) => void;
}

export const NewCategoryModal: React.FC<NewCategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoryCreated,
}) => {
  const { hardwareGroups, addCategory } = useHardwareStore();
  const [categoryName, setCategoryName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = categoryName.trim();
    if (!trimmed) {
      setError('Please provide a category name.');
      return;
    }

    if (hardwareGroups.some(g => g.toLowerCase() === trimmed.toLowerCase())) {
      setError('This construction category already exists in your catalog.');
      return;
    }

    addCategory(trimmed);
    if (onCategoryCreated) {
      onCategoryCreated(trimmed);
    }
    setCategoryName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-slate-900">Create Construction Category</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-500">
            Add a new group for construction supplies that changes frequently (e.g. Gypsum & Ceilings, Waterproofing Admixtures, Pavers & Culverts).
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category Name
            </label>
            <input
              type="text"
              placeholder="e.g. Gypsum & Ceiling Boards"
              value={categoryName}
              onChange={(e) => {
                setCategoryName(e.target.value);
                setError('');
              }}
              autoFocus
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
              required
            />
          </div>

          {/* Quick suggestions common in Ugandan hardware stores */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Popular Ugandan Hardware Suggestions:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Gypsum, Studs & Ceilings',
                'Waterproofing & Chemicals',
                'Security & Chainlink Wire',
                'Pavers, Blocks & Culverts',
                'Glass & Aluminum Profiles',
                'Solar & Power Backup',
              ].map(suggest => (
                <button
                  type="button"
                  key={suggest}
                  onClick={() => setCategoryName(suggest)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                >
                  + {suggest}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-600 font-medium">{error}</p>
          )}

          {/* Existing Groups Preview */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 block mb-1">
              Current Active Categories ({hardwareGroups.length}):
            </span>
            <div className="flex flex-wrap gap-1 text-[11px] text-slate-600 max-h-20 overflow-y-auto">
              {hardwareGroups.map(g => (
                <span key={g} className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                  {g}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
            >
              Create Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
