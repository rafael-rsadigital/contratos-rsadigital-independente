import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NovoContrato from "./pages/NovoContrato";
import Historico from "./pages/Historico";
import CRM from "./pages/CRM";
import ContratoView from "./pages/ContratoView";
import VerificarContrato from "./pages/VerificarContrato";
import AditivoView from "./pages/AditivoView";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/contrato/:id" element={<ContratoView />} />
          <Route path="/aditivo/:id" element={<AditivoView />} />
          <Route path="/verificar-contrato" element={<VerificarContrato />} />
          <Route path="/login" element={<Login />} />

          {/* Protected: admin only */}
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/novo-contrato" element={<ProtectedRoute><NovoContrato /></ProtectedRoute>} />
          <Route path="/historico" element={<ProtectedRoute><Historico /></ProtectedRoute>} />
          <Route path="/crm" element={<ProtectedRoute><CRM /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
