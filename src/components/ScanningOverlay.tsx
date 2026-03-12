import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

interface ScanningOverlayProps {
  isVisible: boolean;
  message?: string;
  subMessage?: string;
}

const ScanningOverlay: React.FC<ScanningOverlayProps> = ({
  isVisible,
  message = "Analizowanie paragonu...",
  subMessage = "Trwa kategoryzowanie wydatków i aktualizacja budżetu",
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md"
        >
          <div className="flex flex-col items-center gap-8">
            {/* Receipt Container */}
            <div className="w-[320px] bg-white rounded-lg shadow-2xl relative overflow-hidden">
              {/* Torn receipt edges - top */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50"></div>

              {/* Receipt Content */}
              <div className="p-6 space-y-4">
                {/* Header - Logo */}
                <div className="flex justify-center">
                  <div className="h-6 w-24 bg-slate-200 rounded animate-pulse"></div>
                </div>

                {/* Body - Item rows */}
                <div className="space-y-3">
                  {[...Array(5)].map((_, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <div className="w-3/4 h-3 bg-slate-100 rounded animate-pulse"></div>
                      <div className="w-1/4 h-3 bg-slate-100 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>

                {/* Footer - Total */}
                <div className="flex justify-end">
                  <div className="w-1/3 h-5 bg-slate-200 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Torn receipt edges - bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50"></div>

              {/* THE LASER SCANNER ANIMATION */}
              <div
                className="absolute left-0 w-full h-[3px] z-50 animate-scan-laser"
                style={{
                  backgroundColor: "#ff7043",
                  boxShadow: "0 0 20px 5px #ff704380",
                }}
              />
            </div>

            {/* Status Text */}
            <div className="flex flex-col items-center gap-2 text-white">
              <div className="flex items-center gap-3">
                <Loader2 size={24} className="animate-spin text-orange-500" />
                <h3 className="text-xl font-semibold tracking-tight">
                  {message}
                </h3>
              </div>
              <p className="text-slate-400 text-sm animate-pulse">
                {subMessage}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScanningOverlay;
