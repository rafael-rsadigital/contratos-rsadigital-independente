import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientData } from "@/types/contract";
import { User, Search, UserPlus, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const clientSchema = z.object({
  nome: z.string().trim().min(3, "Nome deve ter pelo menos 3 caracteres").max(200),
  cpf_cnpj: z.string().trim().min(11, "CPF/CNPJ inválido").max(20),
  celular: z.string().trim().min(10, "Celular inválido").max(20),
  logradouro: z.string().trim().min(3, "Logradouro obrigatório").max(200),
  numero: z.string().trim().min(1, "Número obrigatório").max(20),
  bairro: z.string().trim().min(2, "Bairro obrigatório").max(100),
  cep: z.string().trim().min(8, "CEP inválido").max(10),
  municipio: z.string().trim().min(2, "Município obrigatório").max(100),
  estado: z.string().trim().min(2, "Estado obrigatório").max(2),
  email: z.string().trim().max(255).optional().or(z.literal('')),
});

interface ExistingClient {
  id: string;
  nome: string;
  cpf_cnpj: string;
  celular: string;
  email: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cep: string;
  municipio: string;
  estado: string;
}

interface Props {
  data: ClientData;
  onNext: (data: ClientData, existingClientId?: string) => void;
}

export function Step1ClientData({ data, onNext }: Props) {
  const [mode, setMode] = useState<'search' | 'form'>('search');
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ExistingClient[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ExistingClient | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<ExistingClient | null>(null);

  const form = useForm<ClientData>({
    resolver: zodResolver(clientSchema),
    defaultValues: data,
  });

  // Search existing clients
  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    setSearching(true);
    try {
      const q = searchQuery.trim().toLowerCase();
      const { data: results } = await supabase
        .from('clients')
        .select('*')
        .or(`nome.ilike.%${q}%,cpf_cnpj.ilike.%${q}%,celular.ilike.%${q}%,email.ilike.%${q}%`)
        .order('nome')
        .limit(10);
      setSearchResults(results || []);
    } catch {
      toast.error("Erro ao buscar clientes");
    } finally {
      setSearching(false);
    }
  };

  // Check for duplicates when typing CPF/CNPJ or email
  const watchedCpf = form.watch('cpf_cnpj');
  const watchedEmail = form.watch('email');

  useEffect(() => {
    if (mode !== 'form' || !watchedCpf || watchedCpf.length < 11) {
      setDuplicateWarning(null);
      return;
    }
    const timer = setTimeout(async () => {
      const { data: existing } = await supabase
        .from('clients')
        .select('*')
        .eq('cpf_cnpj', watchedCpf.trim())
        .limit(1);
      if (existing && existing.length > 0) {
        setDuplicateWarning(existing[0]);
      } else {
        setDuplicateWarning(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [watchedCpf, mode]);

  const selectExistingClient = (client: ExistingClient) => {
    setSelectedClient(client);
    const clientData: ClientData = {
      nome: client.nome,
      cpf_cnpj: client.cpf_cnpj,
      celular: client.celular,
      email: client.email || '',
      logradouro: client.logradouro,
      numero: client.numero,
      bairro: client.bairro,
      cep: client.cep,
      municipio: client.municipio,
      estado: client.estado,
    };
    form.reset(clientData);
  };

  const handleSelectAndContinue = () => {
    if (selectedClient) {
      onNext({
        nome: selectedClient.nome,
        cpf_cnpj: selectedClient.cpf_cnpj,
        celular: selectedClient.celular,
        email: selectedClient.email || '',
        logradouro: selectedClient.logradouro,
        numero: selectedClient.numero,
        bairro: selectedClient.bairro,
        cep: selectedClient.cep,
        municipio: selectedClient.municipio,
        estado: selectedClient.estado,
      }, selectedClient.id);
    }
  };

  const useDuplicateClient = () => {
    if (duplicateWarning) {
      selectExistingClient(duplicateWarning);
      setSelectedClient(duplicateWarning);
      setDuplicateWarning(null);
      setMode('search');
    }
  };

  const handleFormSubmit = (formData: ClientData) => {
    onNext(formData);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <User className="w-5 h-5 text-primary" />
          Dados do Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mode toggle */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === 'search' ? 'default' : 'outline'}
            onClick={() => { setMode('search'); setSelectedClient(null); }}
            className="gap-2 flex-1"
          >
            <Search className="w-4 h-4" /> Buscar Cliente Existente
          </Button>
          <Button
            type="button"
            variant={mode === 'form' ? 'default' : 'outline'}
            onClick={() => { setMode('form'); setSelectedClient(null); setSearchResults([]); }}
            className="gap-2 flex-1"
          >
            <UserPlus className="w-4 h-4" /> Criar Novo Cliente
          </Button>
        </div>

        {/* SEARCH MODE */}
        {mode === 'search' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CPF/CNPJ, celular ou e-mail..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
              <Button type="button" onClick={handleSearch} disabled={searching || searchQuery.trim().length < 2}>
                {searching ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {searchResults.map(client => (
                  <div
                    key={client.id}
                    onClick={() => selectExistingClient(client)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedClient?.id === client.id
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/40 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{client.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {client.cpf_cnpj} · {client.celular || '—'} · {client.email || '—'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {client.municipio}/{client.estado}
                        </p>
                      </div>
                      {selectedClient?.id === client.id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchResults.length === 0 && searchQuery.length >= 2 && !searching && (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">Nenhum cliente encontrado.</p>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setMode('form')}
                  className="mt-2"
                >
                  Criar novo cliente →
                </Button>
              </div>
            )}

            {selectedClient && (
              <div className="flex justify-end pt-4">
                <Button size="lg" onClick={handleSelectAndContinue} className="gap-2">
                  <Check className="w-4 h-4" /> Usar este cliente e continuar
                </Button>
              </div>
            )}
          </div>
        )}

        {/* FORM MODE (new client) */}
        {mode === 'form' && (
          <>
            {/* Duplicate warning */}
            {duplicateWarning && (
              <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-lg p-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-yellow-700 dark:text-yellow-400 text-sm">
                    ⚠ Já existe um cliente com esse CPF/CNPJ
                  </p>
                  <p className="text-sm mt-1">
                    <strong>{duplicateWarning.nome}</strong> — {duplicateWarning.cpf_cnpj}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={useDuplicateClient}>
                  Usar existente
                </Button>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="nome" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nome Completo / Razão Social</FormLabel>
                      <FormControl><Input placeholder="Ex: João da Silva" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="cpf_cnpj" render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF / CNPJ</FormLabel>
                      <FormControl><Input placeholder="000.000.000-00" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="celular" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Celular</FormLabel>
                      <FormControl><Input placeholder="(12) 98805-2097" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email <span className="text-muted-foreground text-xs">(opcional)</span></FormLabel>
                      <FormControl><Input type="email" placeholder="email@exemplo.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="logradouro" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logradouro</FormLabel>
                      <FormControl><Input placeholder="Rua, Avenida..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="numero" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl><Input placeholder="123" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="bairro" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl><Input placeholder="Centro" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="cep" render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl><Input placeholder="12345-678" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="municipio" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Município</FormLabel>
                      <FormControl><Input placeholder="São Paulo" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="estado" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado (UF)</FormLabel>
                      <FormControl><Input placeholder="SP" maxLength={2} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" size="lg">Próximo</Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
