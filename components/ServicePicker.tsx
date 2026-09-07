import { ServiceKey } from "@/lib/types";
import { SERVICES } from "@/lib/services";

export default function ServicePicker({
  value,
  onChange,
}: {
  value: ServiceKey;
  onChange: (s: ServiceKey) => void;
}) {
  return (
    <div className="flex gap-2 bg-white/10 rounded-lg p-1 w-fit">
      {(Object.keys(SERVICES) as ServiceKey[]).map((key) => {
        const svc = SERVICES[key];
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
              active ? "text-white" : "text-[#C9DEDD] hover:bg-white/10"
            }`}
            style={active ? { backgroundColor: svc.accentHex } : undefined}
          >
            {svc.label}
          </button>
        );
      })}
    </div>
  );
}
