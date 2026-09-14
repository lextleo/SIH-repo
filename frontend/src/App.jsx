import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import TerrainCanvas from "./TerrainCanvas.jsx";

const API_BASE = "http://127.0.0.1:8000";

const TELEMETRY_ROWS = [
  { key: "min_elevation_m", label: "MIN ELEV", prefix: "" },
  { key: "max_elevation_m", label: "MAX ELEV", prefix: "" },
  { key: "total_relief_m", label: "RELIEF", prefix: "" },
  { key: "rmse_m", label: "RMSE", prefix: "±" },
  { key: "mae_m", label: "MAE", prefix: "" },
];

function formatElapsed(ms) {
  const total = Math.floor(ms / 1000);
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function Header({ filename }) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between px-8 pt-6">
      <div className="font-display text-[15px] font-extrabold tracking-[0.22em] text-bone">
        DEPTHWIZARD
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.28em] text-[#8A8178]">
          ENGINE ONLINE
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#C4783A]" />
        </div>
        {filename ? (
          <div className="font-mono text-[11px] tracking-wide text-copper/80">{filename}</div>
        ) : null}
      </div>
    </header>
  );
}

function Gateway({
  file,
  previewUrl,
  minElev,
  maxElev,
  setMinElev,
  setMaxElev,
  onPick,
  onDrop,
  onReconstruct,
  error,
}) {
  const [over, setOver] = useState(false);

  return (
    <div className="topo-field relative flex h-full w-full items-center px-10 py-24 lg:px-16">
      <Header />
      <div className="mx-auto grid w-full max-w-[1180px] items-center gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16">
        <div className="min-w-0">
          <h1 className="font-display text-[clamp(44px,6.4vw,84px)] font-extrabold leading-[0.88] tracking-[-0.04em] text-bone">
            RELIEF
            <br />
            FROM&nbsp;A&nbsp;TILE
          </h1>
          <p className="mt-8 max-w-md font-mono text-[13px] leading-relaxed text-taupe">
            Upload a satellite still. Reconstruct a calibrated 3D surface.
          </p>
        </div>

        <div className="flex w-full flex-col lg:w-[340px]">
          <button
            type="button"
            onClick={() => document.getElementById("tile-input")?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              onDrop(e.dataTransfer.files?.[0]);
            }}
            className={`relative flex aspect-square w-full flex-col items-center justify-center gap-5 overflow-hidden border border-dashed transition-colors ${
              over ? "border-copper bg-copper/10" : "border-copper/70 bg-transparent"
            }`}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="" className="h-full w-full object-cover opacity-80" />
            ) : (
              <>
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" className="text-copper">
                  <path
                    d="M12 16V4M12 4l-5 5M12 4l5 5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="square"
                  />
                  <path d="M4 18v2h16v-2" stroke="currentColor" strokeWidth="1.4" />
                </svg>
                <span className="font-mono text-[12px] tracking-[0.22em] text-copper">
                  {file ? file.name : "DROP SATELLITE TILE"}
                </span>
              </>
            )}
          </button>
          <input
            id="tile-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0])}
          />

          <div className="mt-8 flex gap-10">
            <label className="flex-1">
              <span className="block font-mono text-[10px] tracking-[0.28em] text-taupe">MIN</span>
              <input
                type="number"
                step="0.1"
                value={minElev}
                onChange={(e) => setMinElev(e.target.value)}
                className="mt-2 w-full border-0 border-b border-copper/70 bg-transparent pb-1 font-mono text-[22px] text-bone outline-none focus:border-copper"
              />
            </label>
            <label className="flex-1">
              <span className="block font-mono text-[10px] tracking-[0.28em] text-taupe">MAX</span>
              <input
                type="number"
                step="0.1"
                value={maxElev}
                onChange={(e) => setMaxElev(e.target.value)}
                className="mt-2 w-full border-0 border-b border-copper/70 bg-transparent pb-1 font-mono text-[22px] text-bone outline-none focus:border-copper"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={onReconstruct}
            disabled={!file}
            className="mt-8 w-full bg-copper py-3.5 font-mono text-[12px] tracking-[0.32em] text-ink disabled:cursor-not-allowed disabled:opacity-30"
          >
            RECONSTRUCT
          </button>
          {error ? (
            <p className="mt-4 font-mono text-[11px] leading-relaxed text-copper">{error}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Processing({ previewUrl, elapsed }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-ink">
      <Header />
      {previewUrl ? (
        <img
          src={previewUrl}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.18] saturate-0"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-b from-ink via-transparent to-ink" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative h-[280px] w-[280px] overflow-hidden border border-copper">
          {previewUrl ? (
            <img src={previewUrl} alt="" className="h-full w-full object-cover opacity-80" />
          ) : (
            <div className="h-full w-full bg-black" />
          )}
          <div className="scan-line absolute left-0 right-0 h-px bg-copper shadow-[0_0_18px_#C4783A]" />
        </div>
        <h2 className="mt-10 font-display text-4xl font-extrabold tracking-[0.18em] text-bone">
          EXTRACTING RELIEF
        </h2>
        <p className="mt-4 font-mono text-[11px] tracking-[0.18em] text-taupe">
          depth inference · geodetic calibration · mesh export
        </p>
      </div>

      <div className="absolute bottom-16 right-16 text-right">
        <div className="font-display text-5xl font-extrabold tracking-wide text-copper">
          {formatElapsed(elapsed)}
        </div>
        <div className="mt-1 font-mono text-[11px] tracking-[0.32em] text-copper">ELAPSED</div>
        <div className="mt-8 font-mono text-[11px] tracking-[0.32em] text-taupe">PROCESSING</div>
      </div>
    </div>
  );
}

function Dashboard({ modelUrl, telemetry, filename, flying, setFlying, onReset }) {
  return (
    <div className="relative h-full w-full bg-ink">
      <TerrainCanvas modelUrl={modelUrl} flying={flying} />
      <div className="corner-frame absolute inset-0 z-10">
        <span className="tl" />
        <span className="tr" />
        <span className="bl" />
        <span className="br" />
      </div>
      <Header filename={filename} />

      <aside className="pointer-events-none absolute left-10 top-28 z-20 border-l border-copper/80 pl-6">
        <dl className="space-y-5">
          {TELEMETRY_ROWS.map((row) => (
            <div key={row.key}>
              <dt className="font-mono text-[10px] tracking-[0.24em] text-taupe">{row.label}</dt>
              <dd className="mt-1 font-display text-[28px] font-extrabold leading-none text-bone">
                {row.prefix}
                {telemetry?.[row.key] ?? "—"}
                <span className="ml-1 font-mono text-[13px] font-normal text-taupe">m</span>
              </dd>
            </div>
          ))}
        </dl>
      </aside>

      <div className="absolute bottom-10 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 border border-copper/50 bg-ink/70 px-6 py-2.5 font-mono text-[11px] tracking-[0.28em] text-bone backdrop-blur-[2px]">
        <button
          type="button"
          onClick={() => setFlying(true)}
          className={flying ? "text-copper" : "text-bone hover:text-copper"}
        >
          FLYTHROUGH
        </button>
        <span className="px-3 text-copper/70">·</span>
        <button
          type="button"
          onClick={() => setFlying(false)}
          className={!flying ? "text-copper" : "text-bone hover:text-copper"}
        >
          ORBIT
        </button>
        <span className="px-3 text-copper/70">·</span>
        <button type="button" onClick={onReset} className="text-bone hover:text-copper">
          NEW TILE
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [stage, setStage] = useState("gateway");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [minElev, setMinElev] = useState("10.0");
  const [maxElev, setMaxElev] = useState("150.0");
  const [telemetry, setTelemetry] = useState(null);
  const [modelUrl, setModelUrl] = useState(null);
  const [flying, setFlying] = useState(false);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);

  const assignFile = useCallback((next) => {
    if (!next) return;
    setFile(next);
    setError("");
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(next);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (stage !== "processing") return undefined;
    startedAt.current = Date.now();
    setElapsed(0);
    const id = setInterval(() => setElapsed(Date.now() - startedAt.current), 250);
    return () => clearInterval(id);
  }, [stage]);

  const reconstruct = async () => {
    if (!file) return;
    const min = parseFloat(minElev);
    const max = parseFloat(maxElev);
    if (Number.isNaN(min) || Number.isNaN(max)) {
      setError("MIN and MAX must be numbers.");
      return;
    }
    if (max <= min) {
      setError("MAX elevation must be greater than MIN.");
      return;
    }

    setError("");
    setStage("processing");

    const formData = new FormData();
    formData.append("image", file);
    formData.append("min_elev", String(min));
    formData.append("max_elev", String(max));

    try {
      const res = await axios.post(`${API_BASE}/api/v1/process-terrain`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 1000 * 60 * 8,
      });
      const path = res.data?.model_url;
      setTelemetry(res.data?.telemetry ?? null);
      setModelUrl(path ? `${API_BASE}${path}` : null);
      setFlying(false);
      setStage("dashboard");
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Pipeline failed. Confirm the FastAPI server is running on port 8000.";
      setError(typeof detail === "string" ? detail : "Pipeline failed.");
      setStage("gateway");
    }
  };

  const reset = () => {
    setStage("gateway");
    setFlying(false);
    setModelUrl(null);
    setTelemetry(null);
    setError("");
  };

  return (
    <div className="h-svh w-screen overflow-hidden bg-ink text-bone">
      {stage === "gateway" && (
        <Gateway
          file={file}
          previewUrl={previewUrl}
          minElev={minElev}
          maxElev={maxElev}
          setMinElev={setMinElev}
          setMaxElev={setMaxElev}
          onPick={assignFile}
          onDrop={assignFile}
          onReconstruct={reconstruct}
          error={error}
        />
      )}
      {stage === "processing" && <Processing previewUrl={previewUrl} elapsed={elapsed} />}
      {stage === "dashboard" && modelUrl && (
        <Dashboard
          modelUrl={modelUrl}
          telemetry={telemetry}
          filename={file?.name}
          flying={flying}
          setFlying={setFlying}
          onReset={reset}
        />
      )}
    </div>
  );
}
