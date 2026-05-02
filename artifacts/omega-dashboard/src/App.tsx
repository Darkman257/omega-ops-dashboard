import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Router as WouterRouter } from "wouter";
import { Router } from "@/components/layout/Router";
import { AppProvider } from "@/context/AppContext";

function App() {
  return (
    <AppProvider>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </AppProvider>
  );
}

export default App;
