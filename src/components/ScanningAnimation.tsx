import React from "react";

const ScanningAnimation: React.FC = () => {
  return (
    <>
      <style>
        {`
          @keyframes scanLaser {
            0%, 100% {
              top: 0px;
            }
            50% {
              top: calc(100% - 20px);
            }
          }
          
          @keyframes dataPulse {
            0%, 100% {
              opacity: 0;
            }
            50% {
              opacity: 1;
            }
          }
          
          @keyframes textBlink {
            0%, 100% {
              opacity: 0.3;
            }
            50% {
              opacity: 1;
            }
          }
        `}
      </style>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        {/* Receipt Container */}
        <div className="relative bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
          {/* Torn paper effect at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-gray-200 to-transparent opacity-50">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 4"
              preserveAspectRatio="none"
            >
              <path d="M0,0 L100,0 L100,4 L0,4 Z" fill="currentColor" />
              <path
                d="M0,4 C20,2 40,3 60,1 C80,-1 100,1 100,4 L0,4 Z"
                fill="white"
              />
            </svg>
          </div>

          {/* Laser Scanner */}
          <div
            className="absolute left-0 right-0 h-1 bg-orange-500 shadow-[0_0_20px_8px_rgba(249,115,22,0.7)]"
            style={{
              animation: "scanLaser 3s ease-in-out infinite",
            }}
          />

          {/* Receipt Content */}
          <div className="relative z-10 space-y-4">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="h-6 bg-gray-300 rounded animate-pulse mx-auto w-24" />
              <div className="h-4 bg-gray-300 rounded animate-pulse mx-auto w-32" />
            </div>

            {/* Data Rows */}
            <div className="space-y-3">
              {/* Row 1 */}
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-300 rounded animate-pulse w-20" />
                <div
                  className="text-green-600 font-mono text-sm animate-pulse"
                  style={{ animation: "dataPulse 1.5s ease-in-out infinite" }}
                >
                  [ analizowanie danych... ]
                </div>
              </div>

              {/* Row 2 */}
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-300 rounded animate-pulse w-24" />
                <div
                  className="text-green-600 font-mono text-sm animate-pulse"
                  style={{ animation: "dataPulse 1.8s ease-in-out infinite" }}
                >
                  [ wyciąganie kwoty... ]
                </div>
              </div>

              {/* Row 3 */}
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-300 rounded animate-pulse w-16" />
                <div
                  className="text-green-600 font-mono text-sm animate-pulse"
                  style={{ animation: "dataPulse 2s ease-in-out infinite" }}
                >
                  [ przetwarzanie... ]
                </div>
              </div>

              {/* Row 4 */}
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-300 rounded animate-pulse w-28" />
                <div
                  className="text-green-600 font-mono text-sm animate-pulse"
                  style={{ animation: "dataPulse 1.6s ease-in-out infinite" }}
                >
                  [ skanowanie pozycji... ]
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="border-t-2 border-gray-300 pt-3 mt-2">
              <div className="flex justify-between items-center">
                <div className="h-5 bg-gray-300 rounded animate-pulse w-16" />
                <div className="h-5 bg-gray-300 rounded animate-pulse w-20" />
              </div>
            </div>
          </div>
        </div>

        {/* Processing Text */}
        <div className="absolute bottom-20 text-center">
          <div
            className="text-white text-lg font-semibold"
            style={{ animation: "textBlink 1.5s ease-in-out infinite" }}
          >
            Sztuczna inteligencja analizuje Twój paragon...
          </div>
        </div>
      </div>
    </>
  );
};

export default ScanningAnimation;
