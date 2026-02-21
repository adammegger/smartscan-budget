import { forwardRef, useImperativeHandle, useRef } from "react";
import { Camera } from "lucide-react";
import { processReceipt } from "../lib/gemini";
import { supabase } from "../lib/supabase";

export interface ScannerRef {
  triggerCamera: () => void;
}

interface ScannerProps {
  onImageCaptured: (imageData: string | Blob) => void;
  onAnalysisComplete: (receiptData: any) => void;
  onAnalysisError: (error: string) => void;
}

const Scanner = forwardRef<ScannerRef, ScannerProps>(function Scanner(
  { onImageCaptured, onAnalysisComplete, onAnalysisError },
  ref,
) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Convert to Base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result;
        if (imageData) {
          onImageCaptured(imageData as string);

          try {
            // Process receipt with Gemini AI
            const receiptData = await processReceipt(imageData as string);

            // Save to Supabase - save receipt without items
            const { data: receiptDataResult, error: receiptError } =
              await supabase
                .from("receipts")
                .insert({
                  store_name: receiptData.store_name,
                  date: receiptData.date,
                  total_amount: receiptData.total_amount,
                  category: receiptData.category,
                  created_at: new Date().toISOString(),
                })
                .select("id")
                .single();

            if (receiptError) {
              throw receiptError;
            }

            // Save items to separate table
            if (receiptData.items && Array.isArray(receiptData.items)) {
              const itemsToInsert = receiptData.items.map((item: any) => ({
                receipt_id: receiptDataResult.id,
                name: item.name,
                price: item.price,
                category: item.category,
              }));

              const { error: itemsError } = await supabase
                .from("items")
                .insert(itemsToInsert);

              if (itemsError) {
                throw itemsError;
              }
            }

            onAnalysisComplete(receiptData);
          } catch (error) {
            console.error("Error processing receipt:", error);
            onAnalysisError(
              error instanceof Error
                ? error.message
                : "Nieznany błąd podczas analizy paragonu",
            );
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerCamera = () => {
    fileInputRef.current?.click();
  };

  useImperativeHandle(ref, () => ({
    triggerCamera,
  }));

  return (
    <>
      {/* Invisible file input for camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
});

export default Scanner;
