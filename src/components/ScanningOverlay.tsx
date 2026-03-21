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
            <div className="w-[320px] relative overflow-hidden">
              {/* Torn receipt edges using pseudo-elements */}
              <div
                className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-transparent via-white to-transparent opacity-80 pointer-events-none z-10"
                style={{
                  backgroundImage: `
                       linear-gradient(45deg, transparent 48%, #e5e7eb 48%, #e5e7eb 52%, transparent 52%),
                       linear-gradient(-45deg, transparent 48%, #e5e7eb 48%, #e5e7eb 52%, transparent 52%)
                     `,
                  backgroundSize: "8px 8px",
                  backgroundPosition: "0 0, 4px 0",
                }}
              ></div>

              {/* Main receipt container with paper-like styling */}
              <div
                className="bg-gradient-to-b from-amber-50 to-amber-100 rounded-lg shadow-2xl relative p-6 space-y-4 border border-amber-200/50"
                style={{
                  backgroundImage: `
                       radial-gradient(circle at 20% 20%, rgba(0,0,0,0.03) 0%, transparent 50%),
                       radial-gradient(circle at 80% 80%, rgba(0,0,0,0.02) 0%, transparent 50%),
                       linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px) 0 0 / 20px 20px
                     `,
                  boxShadow:
                    "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
                  borderRadius: "12px",
                }}
              >
                {/* Header - Store name/logo */}
                <div className="flex justify-center">
                  <div className="text-center">
                    <div
                      className="text-xs font-bold text-gray-600 tracking-widest animate-pulse"
                      style={{
                        backgroundImage:
                          "linear-gradient(90deg, #9ca3af 50%, transparent 50%)",
                        backgroundSize: "2px 100%",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        color: "transparent",
                      }}
                    >
                      SUPERMARKET
                    </div>
                  </div>
                </div>

                {/* Body - Item rows */}
                <div className="space-y-2">
                  {[...Array(5)].map((_, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-xs"
                    >
                      <div
                        className="flex-1 text-gray-700"
                        style={{
                          backgroundImage:
                            "linear-gradient(90deg, #9ca3af 50%, transparent 50%)",
                          backgroundSize: "2px 100%",
                          backgroundClip: "text",
                          WebkitBackgroundClip: "text",
                          color: "transparent",
                        }}
                      >
                        {index === 0
                          ? "CHLEB"
                          : index === 1
                            ? "MASŁO 250G"
                            : index === 2
                              ? "SER"
                              : index === 3
                                ? "JABŁKA 1KG"
                                : "CZOSNEK 200G"}
                      </div>
                      <div
                        className="text-gray-600 font-medium w-16 text-right"
                        style={{
                          backgroundImage:
                            "linear-gradient(90deg, #9ca3af 50%, transparent 50%)",
                          backgroundSize: "2px 100%",
                          backgroundClip: "text",
                          WebkitBackgroundClip: "text",
                          color: "transparent",
                        }}
                      >
                        {index === 0
                          ? "6.50"
                          : index === 1
                            ? "8.90"
                            : index === 2
                              ? "12.30"
                              : index === 3
                                ? "4.80"
                                : "3.20"}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer - Summary line */}
                <div className="border-t-2 border-dashed border-gray-300 my-3"></div>

                <div className="flex justify-between items-center text-sm font-bold text-gray-700">
                  <div
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, #9ca3af 50%, transparent 50%)",
                      backgroundSize: "2px 100%",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    SUMA:
                  </div>
                  <div
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, #9ca3af 50%, transparent 50%)",
                      backgroundSize: "2px 100%",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    35.70 PLN
                  </div>
                </div>
              </div>

              {/* Torn receipt edges - bottom */}
              <div
                className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-transparent via-white to-transparent opacity-80 pointer-events-none z-10"
                style={{
                  backgroundImage: `
                       linear-gradient(45deg, transparent 48%, #e5e7eb 48%, #e5e7eb 52%, transparent 52%),
                       linear-gradient(-45deg, transparent 48%, #e5e7eb 48%, #e5e7eb 52%, transparent 52%)
                     `,
                  backgroundSize: "8px 8px",
                  backgroundPosition: "0 0, 4px 0",
                }}
              ></div>

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
