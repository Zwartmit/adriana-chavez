import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPrice } from "@/lib/utils";

export interface ChartPoint {
  label: string;
  ingresos: number;
}

interface IngresosChartProps {
  data: ChartPoint[];
  variant: "area" | "bar";
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border-gold)",
        borderRadius: "var(--radius-md)",
        padding: "0.6rem 0.9rem",
      }}
    >
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: 4 }}>
        {label}
      </p>
      <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "var(--text-sm)", color: "white" }}>
        {formatPrice(payload[0].value)}
      </p>
    </div>
  );
}

export function IngresosChart({ data, variant }: IngresosChartProps) {
  const tickStyle = { fontFamily: "var(--font-mono)", fontSize: 11, fill: "var(--color-text-on-light-faint)" };

  return (
    <ResponsiveContainer width="100%" height={280}>
      {variant === "bar" ? (
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="rgba(10,10,11,0.06)" vertical={false} />
          <XAxis dataKey="label" tick={tickStyle} axisLine={{ stroke: "var(--color-border-light)" }} tickLine={false} />
          <YAxis
            tick={tickStyle}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(232,201,122,0.06)" }} />
          <Bar dataKey="ingresos" fill="#E8C97A" radius={[4, 4, 0, 0]} />
        </BarChart>
      ) : (
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="ingresosGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E8C97A" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#E8C97A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(10,10,11,0.06)" vertical={false} />
          <XAxis dataKey="label" tick={tickStyle} axisLine={{ stroke: "var(--color-border-light)" }} tickLine={false} />
          <YAxis
            tick={tickStyle}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--color-primary)", strokeWidth: 1 }} />
          <Area type="monotone" dataKey="ingresos" stroke="#E8C97A" strokeWidth={2} fill="url(#ingresosGradient)" />
        </AreaChart>
      )}
    </ResponsiveContainer>
  );
}
