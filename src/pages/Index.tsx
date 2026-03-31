import { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import PedidosList from "@/components/PedidosList";

interface Motoboy {
  id: string;
  nome: string;
  id_motoboy: string;
}

const COMMANDS = ["!!bundleBR", "!!rebr", "!!Br", "!!forzabr"] as const;

const Index = () => {
  const [motoboys, setMotoboys] = useState<Motoboy[]>([]);
  const [comandoAtual, setComandoAtual] = useState("!!bundleBR");
  const [idPedido, setIdPedido] = useState("");
  const [showCadastro, setShowCadastro] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [idMotoboy, setIdMotoboy] = useState("");
  const [pedidosEnviados, setPedidosEnviados] = useState<Set<string>>(new Set());

  useEffect(() => {
    const q = query(collection(db, "entregadores"), orderBy("nome", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: Motoboy[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as { nome: string; id_motoboy: string }),
      }));
      setMotoboys(list);
    });
    return unsub;
  }, []);

  const toggleCadastro = () => {
    setShowCadastro((v) => !v);
    if (showCadastro) resetForm();
  };

  const resetForm = () => {
    setEditId(null);
    setNome("");
    setIdMotoboy("");
  };

  const selecionarMotoboy = (motoboyId: string) => {
    const m = motoboys.find((mb) => mb.id === motoboyId);
    if (m) {
      setEditId(m.id);
      setNome(m.nome);
      setIdMotoboy(m.id_motoboy);
    } else {
      resetForm();
    }
  };

  const salvar = async () => {
    if (!nome || !idMotoboy) return alert("Preencha tudo!");
    if (editId) {
      await updateDoc(doc(db, "entregadores", editId), { nome, id_motoboy: idMotoboy });
    } else {
      await addDoc(collection(db, "entregadores"), { nome, id_motoboy: idMotoboy });
    }
    resetForm();
    setShowCadastro(false);
  };

  const deletar = async () => {
    if (!editId || !confirm("Deseja realmente excluir este entregador?")) return;
    await deleteDoc(doc(db, "entregadores", editId));
    resetForm();
    setShowCadastro(false);
  };

  const colarPedido = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setIdPedido(text.replace(/\D/g, ""));
    } catch {
      alert("Dê permissão para acessar a área de transferência.");
    }
  };

  const enviar = (nomeMotoboy: string, id: string) => {
    if (!idPedido) return alert("Falta o ID do pedido!");
    
    const executarEnvio = () => {
      const msg = `${comandoAtual} ${idPedido} ${id}`;
      setPedidosEnviados((prev) => new Set(prev).add(idPedido));
      navigator.clipboard.writeText(msg).then(() => {
        window.location.href = `https://wa.me/?text=${encodeURIComponent(msg)}`;
      });
    };

    if (pedidosEnviados.has(idPedido)) {
      if (!confirm("⚠️ Você já tentou enviar esse pedido!\nDeseja repetir mesmo assim?")) return;
    }
    
    executarEnvio();
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-6 pt-4">
          <div>
            <h1 className="text-2xl font-black italic text-primary tracking-tighter uppercase">Fast Command</h1>
            <p className="text-[10px] text-muted-foreground tracking-[0.3em] uppercase font-bold font-mono">
              Despacho Rápido
            </p>
          </div>
          <button
            onClick={toggleCadastro}
            className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary text-2xl font-bold active:scale-90 shadow-lg shadow-primary/10 transition-transform"
          >
            +
          </button>
        </header>

        {/* Painel Cadastro */}
        {showCadastro && (
          <div className="mb-8 p-6 bg-card rounded-3xl border border-primary/20 shadow-2xl animate-in slide-in-from-top-2">
            <h3 className="text-xs font-bold text-primary mb-4 uppercase">
              Gerenciar Motoboys
            </h3>
            {motoboys.length > 0 && (
              <select
                value={editId || ""}
                onChange={(e) => selecionarMotoboy(e.target.value)}
                className="w-full p-4 mb-3 bg-background rounded-xl outline-none border border-border text-foreground"
              >
                <option value="">+ Novo Motoboy</option>
                {motoboys.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome} (ID: {m.id_motoboy})
                  </option>
                ))}
              </select>
            )}
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              type="text"
              placeholder="Nome"
              className="w-full p-4 mb-3 bg-background rounded-xl outline-none border border-border text-foreground"
            />
            <input
              value={idMotoboy}
              onChange={(e) => setIdMotoboy(e.target.value)}
              type="text"
              placeholder="ID"
              className="w-full p-4 mb-4 bg-background rounded-xl outline-none border border-border text-foreground"
            />
            <div className="flex gap-2">
              <button onClick={salvar} className="flex-1 p-4 bg-primary text-primary-foreground rounded-xl font-bold uppercase text-xs">
                {editId ? "Atualizar" : "Salvar"}
              </button>
              {editId && (
                <button onClick={deletar} className="p-4 bg-destructive/20 text-destructive border border-destructive/30 rounded-xl font-bold text-xs uppercase">
                  Excluir
                </button>
              )}
              <button onClick={toggleCadastro} className="p-4 bg-secondary rounded-xl font-bold text-xs text-secondary-foreground">
                X
              </button>
            </div>
          </div>
        )}

        {/* Comandos */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {COMMANDS.map((cmd) => (
            <button
              key={cmd}
              onClick={() => setComandoAtual(cmd)}
              className={`p-3 rounded-xl font-bold text-[10px] transition-all ${
                comandoAtual === cmd
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-secondary text-muted-foreground border border-border"
              }`}
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Pedidos da API */}
        <PedidosList
          onSelectPedido={(id) => setIdPedido(id)}
          pedidoSelecionado={idPedido}
        />

        {/* Input Pedido Manual */}
        <div className="mb-6">
          <div className="relative mb-2">
            <input
              value={idPedido}
              onChange={(e) => setIdPedido(e.target.value.replace(/\D/g, ""))}
              type="text"
              inputMode="numeric"
              placeholder="ID DO PEDIDO"
              className="w-full p-3.5 bg-background border-2 border-border rounded-2xl text-xl font-black text-center text-primary outline-none focus:border-primary/50 transition-all"
            />
            {idPedido && (
              <button onClick={() => setIdPedido("")} className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground text-xl font-bold">
                ✕
              </button>
            )}
          </div>
          <button
            onClick={colarPedido}
            className="w-full p-3 bg-primary/10 text-primary border border-primary/30 rounded-xl font-bold text-xs uppercase active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>📋</span> COLAR MANUAL
          </button>
        </div>

        {/* Lista Motoboys */}
        <h2 className="text-[9px] font-bold text-muted-foreground mb-4 uppercase tracking-[0.3em] ml-2 font-mono italic">
          Destinos Disponíveis (3×3):
        </h2>
        <div className="grid grid-cols-3 gap-2 pb-24">
          {motoboys.length === 0 ? (
            <p className="col-span-3 text-muted-foreground text-[10px] animate-pulse text-center">
              Sincronizando Banco...
            </p>
          ) : (
            motoboys.map((m) => (
              <div key={m.id} className="relative">
                <button
                  onClick={() => enviar(m.nome, m.id_motoboy)}
                  className="w-full h-[90px] p-2 bg-card/80 rounded-xl border border-border active:bg-primary/20 transition-all shadow-lg flex flex-col justify-center items-center overflow-hidden"
                >
                  <span className="font-bold text-[13px] text-foreground uppercase mb-1 line-clamp-2 leading-tight text-center">
                    {m.nome}
                  </span>
                  <span className="text-[9px] text-primary font-mono font-bold tracking-tighter">
                    ID: {m.id_motoboy}
                  </span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
