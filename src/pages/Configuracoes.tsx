import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { ArrowLeft, Save, Upload, KeyRound, Image as ImageIcon } from "lucide-react";

export default function Configuracoes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading, reload } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nomeContratado, setNomeContratado] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cidade, setCidade] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [multaPct, setMultaPct] = useState("2");
  const [jurosPct, setJurosPct] = useState("1");
  const [multaRescisoriaPct, setMultaRescisoriaPct] = useState("20");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [savingSenha, setSavingSenha] = useState(false);

  useEffect(() => {
    if (profile) {
      setNomeContratado(profile.nome_contratado || "");
      setCnpj(profile.cnpj || "");
      setNomeFantasia(profile.nome_fantasia || "");
      setCidade(profile.cidade || "");
      setWhatsapp(profile.whatsapp || "");
      setMultaPct(String(profile.multa_pct ?? 2));
      setJurosPct(String(profile.juros_pct ?? 1));
      setMultaRescisoriaPct(String(profile.multa_rescisoria_pct ?? 20));
      setLogoUrl(profile.logo_url);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles' as any)
      .update({
        nome_contratado: nomeContratado,
        cnpj,
        nome_fantasia: nomeFantasia,
        cidade,
        whatsapp,
        multa_pct: Number(multaPct) || 0,
        juros_pct: Number(jurosPct) || 0,
        multa_rescisoria_pct: Number(multaRescisoriaPct) || 0,
      } as any)
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar configurações.");
      return;
    }
    toast.success("Configurações salvas!");
    reload();
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      toast.error("Envie um arquivo de imagem (PNG, JPG, SVG...).");
      return;
    }
    setUploadingLogo(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/logo.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Erro ao enviar logo.");
      setUploadingLogo(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('logos').getPublicUrl(path);
    // Cache-bust so the new logo shows immediately even with the same filename
    const newUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from('profiles' as any)
      .update({ logo_url: newUrl } as any)
      .eq('id', user.id);

    setUploadingLogo(false);
    if (updateError) {
      toast.error("Logo enviada, mas houve erro ao salvar. Tente novamente.");
      return;
    }
    setLogoUrl(newUrl);
    toast.success("Logo atualizada!");
    reload();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha.length < 6) {
      toast.error("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setSavingSenha(true);
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    setSavingSenha(false);
    if (error) {
      toast.error("Erro ao alterar senha.");
      return;
    }
    setNovaSenha("");
    setConfirmarSenha("");
    toast.success("Senha alterada com sucesso!");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex items-center gap-3 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold">Configurações</h1>
        </div>
      </header>

      <main className="container max-w-2xl py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Logo</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-lg border flex items-center justify-center bg-muted/30 overflow-hidden shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <ImageIcon className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              <Button variant="outline" size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={uploadingLogo}>
                <Upload className="w-4 h-4" />
                {uploadingLogo ? "Enviando..." : "Enviar logo"}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">Aparece no topo de todos os seus contratos.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados da Contratada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome / Razão Social</Label>
              <Input value={nomeContratado} onChange={e => setNomeContratado(e.target.value)} placeholder="Seu nome completo ou razão social" />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
            </div>
            <div className="space-y-2">
              <Label>Nome Fantasia</Label>
              <Input value={nomeFantasia} onChange={e => setNomeFantasia(e.target.value)} placeholder="Nome da sua empresa" />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Cidade – UF" />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp (com DDI e DDD, só números)</Label>
              <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="5512999999999" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Juros e Multa</CardTitle>
            <p className="text-sm text-muted-foreground">Usados na cláusula de inadimplência e cancelamento dos seus contratos.</p>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Multa (%)</Label>
              <Input type="number" step="0.1" min="0" value={multaPct} onChange={e => setMultaPct(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Juros ao mês (%)</Label>
              <Input type="number" step="0.1" min="0" value={jurosPct} onChange={e => setJurosPct(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Multa rescisória (%)</Label>
              <Input type="number" step="0.1" min="0" value={multaRescisoriaPct} onChange={e => setMultaRescisoriaPct(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full gap-2" size="lg">
          <Save className="w-4 h-4" />
          {saving ? "Salvando..." : "Salvar configurações"}
        </Button>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alterar Senha</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label>Nova senha</Label>
                <Input type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="space-y-2">
                <Label>Confirmar nova senha</Label>
                <Input type="password" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} placeholder="••••••••" />
              </div>
              <Button type="submit" variant="outline" className="w-full gap-2" disabled={savingSenha}>
                <KeyRound className="w-4 h-4" />
                {savingSenha ? "Salvando..." : "Alterar senha"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
