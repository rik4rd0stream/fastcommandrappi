import { useState } from "react";

const PROFILES: Record<string, { password: string; label: string }> = {
  programador: { password: "1234", label: "Programador" },
  lider: { password: "5678", label: "Líder (Master)" },
};

interface LoginScreenProps {
  onLogin: (perfil: string) => void;
}

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [selectedPerfil, setSelectedPerfil] = useState<string | null>(null);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const handleLogin = () => {
    if (!selectedPerfil) return;
    const profile = PROFILES[selectedPerfil];
    if (senha === profile.password) {
      localStorage.setItem("perfil", selectedPerfil);
      onLogin(selectedPerfil);
    } else {
      setErro("Senha incorreta!");
      setSenha("");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black italic text-primary tracking-tighter uppercase">
            Fast Command
          </h1>
          <p className="text-[10px] text-muted-foreground tracking-[0.3em] uppercase font-bold font-mono">
            Identificação
          </p>
        </div>

        {!selectedPerfil ? (
          <div className="space-y-3">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.3em] text-center font-mono italic mb-4">
              Selecione seu perfil
            </p>
            {Object.entries(PROFILES).map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => setSelectedPerfil(key)}
                className="w-full p-5 bg-card rounded-2xl border border-border text-foreground font-bold text-lg uppercase active:scale-95 transition-all shadow-lg"
              >
                {label}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => { setSelectedPerfil(null); setSenha(""); setErro(""); }}
              className="text-[10px] text-muted-foreground uppercase font-bold"
            >
              ← Voltar
            </button>
            <p className="text-center text-lg font-bold text-primary uppercase">
              {PROFILES[selectedPerfil].label}
            </p>
            <input
              type="password"
              inputMode="numeric"
              value={senha}
              onChange={(e) => { setSenha(e.target.value); setErro(""); }}
              placeholder="Senha"
              className="w-full p-4 bg-background border-2 border-border rounded-2xl text-xl font-black text-center text-foreground outline-none focus:border-primary/50 transition-all"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              autoFocus
            />
            {erro && (
              <p className="text-destructive text-[11px] text-center bg-destructive/10 rounded-xl p-2 border border-destructive/20">
                {erro}
              </p>
            )}
            <button
              onClick={handleLogin}
              className="w-full p-4 bg-primary text-primary-foreground rounded-2xl font-bold uppercase text-sm active:scale-95 transition-all"
            >
              Entrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
