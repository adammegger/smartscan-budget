import { useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "./ui/button";
import Scanner from "./Scanner";
import ReceiptVerification from "./ReceiptVerification";
import type { ReceiptData } from "../lib/receiptVerification";
import type { ScannerRef } from "./Scanner";

export default function Dashboard() {
  const [scannerRef, setScannerRef] = useState<ScannerRef | null>(null);
  const [verificationReceipt, setVerificationReceipt] =
    useState<ReceiptData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleTriggerMockScan = async () => {
    if (scannerRef && scannerRef.triggerMockScan) {
      setIsAnalyzing(true);
      try {
        await scannerRef.triggerMockScan();
      } catch (error) {
        console.error("Mock scan error:", error);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleAnalysisComplete = (receiptData: ReceiptData) => {
    // Stop the flow! Show verification screen instead of finishing.
    setVerificationReceipt(receiptData);
  };

  const handleAnalysisError = (error: string) => {
    console.error("Analysis error:", error);
    setIsAnalyzing(false);
    // Handle error (show toast, etc.)
  };

  const handleSaveVerifiedReceipt = async (finalData: ReceiptData) => {
    try {
      // Import the save function dynamically to avoid circular imports
      const { saveReceiptToSupabase } =
        await import("../lib/receiptVerification");

      // Save to Supabase with the final edited data
      await saveReceiptToSupabase(finalData);

      // Close modal and reset state
      setVerificationReceipt(null);

      // Optional: Show success toast
      console.log("Receipt saved successfully!");
    } catch (error) {
      console.error("Error saving receipt:", error);
      // Handle error (show error toast, etc.)
    }
  };

  const handleVerificationCancel = () => {
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

      {/* Main Dashboard Content */}
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
              <Button
                onClick={handleTriggerMockScan}
                disabled={isAnalyzing}
                className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Camera size={20} />
                {isAnalyzing ? "Skanowanie..." : "Symulacja/Skanuj (Mock)"}
              </Button>
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
