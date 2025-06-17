import { useToast } from "primevue/usetoast";
export default function useNotification() {
  const toast = useToast();
  const showToast = (severity : any, message: any) => {
    toast.add({
          severity: severity,
            detail: message,
            life: 3000
      })

      
  };

  return {
    showMessage: (message: any) => {    
      showToast("success", message);
    },
    showError: (message: any) => {
      showToast("error", message);
    },
    showWarning: (message: any) => {
      showToast("warn", message);
    },
    showInfo: (message: any) => {
      showToast("info", message);
    },
  };
}
