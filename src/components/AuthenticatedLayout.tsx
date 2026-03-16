import { useState } from "react";
import Scanner from "./Scanner";
import ReceiptVerification from "./ReceiptVerification";
import { ReceiptData } from "./ReceiptVerification";

export default function AuthenticatedLayout() {
  const [scannerRef, setScannerRef] = useState<any>(null);
  const [verificationReceipt, setVerificationReceipt] =
    useState<ReceiptData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleTriggerMockScan = async () => {
    console.log("🔍 AuthenticatedLayout: handleTriggerMockScan called");
    if (scannerRef && scannerRef.triggerMockScan) {
      console.log(
        "🔍 AuthenticatedLayout: scannerRef.triggerMockScan exists, calling...",
      );
      setIsAnalyzing(true);
      try {
        await scannerRef.triggerMockScan();
        console.log(
          "🔍 AuthenticatedLayout: triggerMockScan completed successfully",
        );
      } catch (error) {
        console.error("🔍 AuthenticatedLayout: Mock scan error:", error);
      } finally {
        console.log("🔍 AuthenticatedLayout: setting isAnalyzing to false");
        setIsAnalyzing(false);
      }
    } else {
      console.error(
        "🔍 AuthenticatedLayout: scannerRef or triggerMockScan not available",
      );
    }
  };

  const handleAnalysisComplete = (receiptData: ReceiptData) => {
    console.log(
      "🔍 AuthenticatedLayout: handleAnalysisComplete called with:",
      receiptData,
    );
    // Stop the flow! Show verification screen instead of finishing.
    setVerificationReceipt(receiptData);
    setIsAnalyzing(false);
    console.log(
      "🔍 AuthenticatedLayout: verificationReceipt set, isAnalyzing set to false",
    );
  };

  const handleAnalysisError = (error: string) => {
    console.error("🔍 AuthenticatedLayout: Analysis error:", error);
    setIsAnalyzing(false);
    // Handle error (show toast, etc.)
  };

  const handleSaveVerifiedReceipt = async (finalData: ReceiptData) => {
    try {
      console.log(
        "🔍 AuthenticatedLayout: handleSaveVerifiedReceipt called with:",
        finalData,
      );
      // Import the save function dynamically to avoid circular imports
      const { saveReceiptToSupabase } =
        await import("../lib/receiptVerification");

      // Save to Supabase with the final edited data
      await saveReceiptToSupabase(finalData);

      // Close modal and reset state
      setVerificationReceipt(null);

      // Optional: Show success toast
      console.log("🔍 AuthenticatedLayout: Receipt saved successfully!");
    } catch (error) {
      console.error("🔍 AuthenticatedLayout: Error saving receipt:", error);
      // Handle error (show error toast, etc.)
    }
  };

  const handleVerificationCancel = () => {
    console.log("🔍 AuthenticatedLayout: handleVerificationCancel called");
    // Close modal without saving
    setVerificationReceipt(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Scanner component - hidden but functional */}
      <Scanner
        ref={setScannerRef}
        onImageCaptured={() => {
          // Handle image capture if needed
        }}
        onAnalysisComplete={handleAnalysisComplete}
        onAnalysisError={handleAnalysisError}
      />

      {/* Main content - Dashboard with trigger button */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-8">
            SmartScan Budget
          </h1>

          <div className="space-y-4">
            <p className="text-muted-foreground">
              Test the receipt verification flow by clicking the button below:
            </p>

            <div className="flex justify-center">
              <button
                onClick={handleTriggerMockScan}
                disabled={isAnalyzing}
                className="gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>📸</span>
                {isAnalyzing ? "Skanowanie..." : "Symulacja/Skanuj (Mock)"}
              </button>
            </div>

            {isAnalyzing && (
              <div className="flex justify-center items-center gap-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                <span>Przetwarzanie obrazu...</span>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 max-w-2xl mx-auto text-center">
          <div className="bg-card border border-border/50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Jak działa weryfikacja?
            </h2>
            <ol className="text-left text-muted-foreground space-y-2">
              <li>1. Kliknij przycisk "Symulacja/Skanuj (Mock)"</li>
              <li>
                2. Poczekaj 2 sekundy na przetworzenie (AI analizuje paragon)
              </li>
              <li>
                3. Pojawi się modal "Weryfikacja paragonu" z wygenerowanymi
                danymi
              </li>
              <li>4. Przejrzyj i popraw dane (sklep, datę, produkty)</li>
              <li>5. Kliknij "Zapisz i zakończ" aby zapisać do bazy danych</li>
              <li>6. Lub "Odrzuć" aby anulować bez zapisywania</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Receipt Verification Modal */}
      {verificationReceipt && (
        <ReceiptVerification
          receiptData={verificationReceipt}
          isOpen={true}
          onClose={handleVerificationCancel}
          onReject={handleVerificationCancel}
          onSave={handleSaveVerifiedReceipt}
        />
      )}
    </div>
  );
}
