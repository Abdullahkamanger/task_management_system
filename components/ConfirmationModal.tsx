'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = 'info'
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const colors = {
    danger: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500"
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#22272b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-full ${colors[type]}/10`}>
                <AlertCircle className={`text-${type === 'info' ? 'blue' : type === 'warning' ? 'yellow' : 'red'}-400`} size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
            </div>
            
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              {message}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`px-6 py-2 text-sm font-bold text-white rounded-lg shadow-lg hover:shadow-xl transition-all ${colors[type]} hover:opacity-90`}
              >
                {confirmText}
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
