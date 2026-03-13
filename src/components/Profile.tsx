import { useState, useEffect } from "react";
import {
  User,
  Key,
  AlertTriangle,
  Trash2,
  ArrowLeft,
  CheckCircle,
  Edit3,
  CreditCard,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import ConfirmationModal from "./ConfirmationModal";
import { deleteUserAccount, getUserDataSummary } from "../lib/userDeletion";
import { useDataCache } from "../lib/cacheUtils";

export default function Profile() {
  const [userEmail, setUserEmail] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSaveMessage, setNameSaveMessage] = useState<string>("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userDataSummary, setUserDataSummary] = useState<{
    receipts_count: number;
    budgets_count: number;
    profile_exists: boolean;
  } | null>(null);
  const navigate = useNavigate();

  // Data cache for updating profile data
  const { setUserProfile, refreshUserProfile, userProfile } = useDataCache();

  // Toast state for notifications
  const [toastMsg, setToastMsg] = useState<{
    title: string;
    type: "success" | "error";
  } | null>(null);

  // Helper to show toast that auto-hides after 3 seconds
  const showToast = (title: string, type: "success" | "error" = "success") => {
    setToastMsg({ title, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    // Get current user email and profile data
    const getCurrentUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUserEmail(user.email || "");

          // Fetch profile data to get current first_name and last_name
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", user.id)
            .single();

          if (error && error.code !== "PGRST116") {
            console.error("Error fetching profile:", error);
          } else if (profile) {
            setFirstName(profile.first_name || "");
            setLastName(profile.last_name || "");
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    getCurrentUser();
  }, []);

  const handleResetPassword = async () => {
    if (!userEmail) {
      setResetMessage("Nie można zresetować hasła - brak adresu e-mail");
      return;
    }

    setIsResettingPassword(true);
    setResetMessage("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        throw error;
      }

      setResetMessage("Link został wysłany. Sprawdź swoją skrzynkę e-mail.");
    } catch (error) {
      console.error("Password reset error:", error);
      setResetMessage(
        "Wystąpił błąd podczas wysyłania linku do resetowania hasła.",
      );
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSaveName = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setNameSaveMessage("Nie jesteś zalogowany");
        return;
      }

      setIsSavingName(true);
      setNameSaveMessage("");

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      setNameSaveMessage("Dane zostały zapisane pomyślnie!");
      setIsEditingName(false);

      // Update the data cache to reflect changes immediately
      await refreshUserProfile();

      // Show success toast
      showToast("Dane profilu zostały zaktualizowane", "success");
    } catch (error) {
      console.error("Error saving profile:", error);
      setNameSaveMessage("Wystąpił błąd podczas zapisywania danych.");
    } finally {
      setIsSavingName(false);
    }
  };

  // Load user data summary when modal opens
  useEffect(() => {
    const loadUserDataSummary = async () => {
      if (showDeleteModal) {
        const summary = await getUserDataSummary();
        if (!summary.error) {
          setUserDataSummary(summary);
        }
      }
    };

    loadUserDataSummary();
  }, [showDeleteModal]);

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeletingAccount(true);

    try {
      const result = await deleteUserAccount();

      if (result.success) {
        // Clear local state and sign out
        setUserEmail("");
        setShowDeleteModal(false);

        // Sign out the user
        await supabase.auth.signOut();

        // Redirect to landing page
        navigate("/", { replace: true });
      } else {
        // Show error message
        showToast(`Błąd podczas usuwania konta: ${result.error}`, "error");
        setIsDeletingAccount(false);
      }
    } catch (error) {
      console.error("Delete account error:", error);
      showToast("Wystąpił nieoczekiwany błąd podczas usuwania konta.", "error");
      setIsDeletingAccount(false);
    }
  };

  const handleCloseModal = () => {
    setShowDeleteModal(false);
    setUserDataSummary(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header with centered title and back button */}
      <header className="px-6 lg:px-12 xl:px-16 2xl:px-24 py-8">
        <div className="max-w-2xl mx-auto relative">
          {/* Back Button - positioned to the left of the title */}
          <button
            onClick={() => navigate(-1)}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-all duration-200 group cursor-pointer"
            aria-label="Powrót"
          >
            <ArrowLeft
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
          </button>

          {/* Centered Title */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Profil</h1>
            <p className="text-sm text-muted-foreground">
              Zarządzaj swoim kontem i ustawieniami
            </p>
          </div>
        </div>
      </header>

      <main className="px-6 lg:px-12 xl:px-16 2xl:px-24 pb-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* User Information Section */}
          <div className="bg-card border border-border/50 rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-3 rounded-lg">
                <User size={24} className="text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Informacje o użytkowniku
                </h2>
                <p className="text-sm text-muted-foreground">
                  Podstawowe informacje o Twoim koncie
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Adres e-mail</p>
                  <p className="font-medium text-foreground">{userEmail}</p>
                </div>
                {/* <div className="text-xs text-muted-foreground bg-green-500/20 text-green-600 px-2 py-1 rounded-full">
                  Aktywne
                </div> */}
              </div>

              {/* Name Editing Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Imię i nazwisko
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Zaktualizuj swoje dane osobowe
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingName(!isEditingName)}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-6 py-2 rounded-full transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Edit3 size={16} className="mr-2" />
                    {isEditingName ? "Anuluj" : "Edytuj"}
                  </Button>
                </div>

                {nameSaveMessage && (
                  <div
                    className={`p-3 rounded-lg ${
                      nameSaveMessage.includes("Błąd")
                        ? "bg-red-500/10 border border-red-500/20 text-red-600"
                        : "bg-green-500/10 border border-green-500/20 text-green-600"
                    }`}
                  >
                    {nameSaveMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">
                      Imię
                    </Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={!isEditingName}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500"
                      placeholder="Wprowadź imię"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">
                      Nazwisko
                    </Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={!isEditingName}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500"
                      placeholder="Wprowadź nazwisko"
                    />
                  </div>
                </div>

                {isEditingName && (
                  <div className="flex gap-4">
                    <Button
                      onClick={handleSaveName}
                      disabled={isSavingName}
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-6 py-2 rounded-full transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingName ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Zapisywanie...
                        </div>
                      ) : (
                        "Zapisz zmiany"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subscription Management Section */}
          {userProfile?.subscription_tier === "pro" && (
            <div className="bg-card border border-border/50 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-3 rounded-lg">
                  <CreditCard size={24} className="text-orange-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Zarządzanie Subskrypcją
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Faktury i anulowanie subskrypcji
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Zarządzaj swoją subskrypcją PRO, przeglądaj faktury i anuluj
                  subskrypcję w dowolnym momencie.
                </p>

                <div className="flex gap-4">
                  <Button
                    onClick={() =>
                      window.open(
                        "https://billing.stripe.com/p/login/test_28E4gB1N67PO5kUdrf9IQ00",
                        "_blank",
                        "noopener,noreferrer",
                      )
                    }
                    variant="outline"
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-6 py-2 rounded-full transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Faktury i anulowanie
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Change Password Section */}
          <div className="bg-card border border-border/50 rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-3 rounded-lg">
                <Key size={24} className="text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Zmień hasło
                </h2>
                <p className="text-sm text-muted-foreground">
                  Zabezpiecz swoje konto nowym hasłem
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Wyślij e-mail z linkiem do resetowania hasła na Twój adres
                e-mail.
              </p>

              <div className="flex gap-4">
                <Button
                  onClick={handleResetPassword}
                  disabled={isResettingPassword}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-6 py-2 rounded-full transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResettingPassword ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Wysyłanie...
                    </div>
                  ) : (
                    "Wyślij link do resetowania hasła"
                  )}
                </Button>
              </div>

              {resetMessage && (
                <div
                  className={`p-4 rounded-lg ${
                    resetMessage.includes("Wystąpił błąd")
                      ? "bg-red-500/10 border border-red-500/20 text-red-600"
                      : "bg-green-500/10 border border-green-500/20 text-green-600"
                  }`}
                >
                  {resetMessage}
                </div>
              )}
            </div>
          </div>

          {/* Delete Account Section */}
          <div className="bg-card border border-border/50 rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 p-3 rounded-lg">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Usuń konto
                </h2>
                <p className="text-sm text-muted-foreground">
                  Trwałe usunięcie konta i wszystkich danych
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center gap-3 text-red-600">
                  <AlertTriangle size={20} />
                  <span className="font-semibold">Ostrożnie!</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Usunięcie konta jest nieodwracalne. Wszystkie Twoje dane, w
                  tym paragony, budżety i osiągnięcia zostaną trwale usunięte.
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleDeleteAccount}
                  variant="destructive"
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-full transition-all duration-200 hover:scale-105 shadow-lg cursor-pointer"
                >
                  <Trash2 size={16} className="mr-2" />
                  Usuń konto
                </Button>
              </div>

              {/* Confirmation Modal */}
              <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={handleCloseModal}
                onConfirm={handleConfirmDelete}
                title="Potwierdź usunięcie konta"
                description={`Czy na pewno chcesz usunąć swoje konto? Tej operacji nie można cofnąć.

${
  userDataSummary
    ? `Twoje dane do usunięcia:
- Paragony: ${userDataSummary.receipts_count}
- Budżety: ${userDataSummary.budgets_count}
- Profil: ${userDataSummary.profile_exists ? "Tak" : "Nie"}`
    : "Pobieranie informacji o danych..."
}`}
                confirmText="Tak, usuń konto"
                cancelText="Anuluj"
                isLoading={isDeletingAccount}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              toastMsg.type === "success"
                ? "bg-green-500/95 text-white"
                : "bg-red-500/95 text-white"
            }`}
          >
            {toastMsg.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <AlertTriangle size={20} />
            )}
            <span className="font-medium">{toastMsg.title}</span>
          </div>
        </div>
      )}
    </div>
  );
}
