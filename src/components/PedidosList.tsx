import { useState, useEffect, useCallback } from "react";

const getRedashUrl = () => {
  if (import.meta.env.DEV) {
    return "/api/redash/api/queries/130603/results.json?api_key=VqwlaUY9wOLjhUJTvrfuKdFExSsJG8ktuzUXy4fR";
  }
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  return `https://${projectId}.supabase.co/functions/v1/redash-proxy`;
};

interface Pedido {
  order_id: string | number;
  store_name: string;
}

interface PedidosListProps {
  onSelectPedido: (orderId: string) => void;
  pedidoSelecionado: string;
}

const PedidosList = ({ onSelectPedido, pedidoSelecionado }: PedidosListProps) => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const buscarPedidos = useCallback(async () => {
    setLoading(true);
    setErro("");
    try {
      const response = await fetch(REDASH_URL);
      if (!response.ok) throw new Error("Erro ao buscar pedidos");
      const data = await response.json();
      const rows = data.query_result.data.rows;

      const pedidosAlphaville = rows.filter(
        (p: any) => p.point_id == 9944
      );
      const disponiveis = pedidosAlphaville.filter(
        (p: any) => p.rt_asignado_orden === null || p.rt_asignado_orden === ""
      );

      setPedidos(
        disponiveis.map((p: any) => ({
          order_id: p.order_id,
          store_name: p.store_name,
        }))
      );
    } catch (e: any) {
      setErro("Não foi possível carregar os pedidos. Verifique a conexão.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    buscarPedidos();
    const interval = setInterval(buscarPedidos, 30000);
    return () => clearInterval(interval);
  }, [buscarPedidos]);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.3em] ml-2 font-mono italic">
          Pedidos Sin RT
        </h2>
        <button
          onClick={buscarPedidos}
          disabled={loading}
          className="text-[10px] px-3 py-1.5 bg-primary/10 text-primary rounded-lg font-bold uppercase border border-primary/20 active:scale-95 transition-transform disabled:opacity-50"
        >
          {loading ? "..." : "🔄 Atualizar"}
        </button>
      </div>

      {erro && (
        <p className="text-destructive text-[11px] text-center mb-2 bg-destructive/10 rounded-xl p-3 border border-destructive/20">
          {erro}
        </p>
      )}

      {loading && pedidos.length === 0 ? (
        <p className="text-muted-foreground text-[10px] animate-pulse text-center py-4">
          Buscando pedidos...
        </p>
      ) : pedidos.length === 0 && !erro ? (
        <p className="text-muted-foreground text-[11px] text-center py-4 bg-card rounded-xl border border-border">
          Nenhum pedido disponível no momento
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-1">
          {pedidos.map((p) => {
            const id = String(p.order_id);
            const isSelected = pedidoSelecionado === id;
            return (
              <button
                key={id}
                onClick={() => onSelectPedido(id)}
                className={`w-full p-3 rounded-xl border text-left transition-all active:scale-[0.98] ${
                  isSelected
                    ? "bg-primary/20 border-primary/50 shadow-lg shadow-primary/10"
                    : "bg-card/80 border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[12px] text-foreground">
                    {p.store_name}
                  </span>
                  <span className={`text-[10px] font-mono font-bold ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                    #{id}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PedidosList;
