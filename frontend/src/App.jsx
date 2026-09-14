import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { Upload, Play, Square, Crosshair, Radar } from 'lucide-react';
import axios from 'axios';
import * as THREE from 'three';

function TerrainModel({ url, isFlying }) {
  const { scene } = useGLTF(url);
  const cameraRef = useRef();
  const t = useRef(0);
  
  const box = new THREE.Box3().setFromObject(scene);
  const center = box.getCenter(new THREE.Vector3());
  scene.position.sub(center);

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-30, 20, 30),
    new THREE.Vector3(-10, 10, 5),
    new THREE.Vector3(20, 15, -15),
    new THREE.Vector3(5, 25, -25),
    new THREE.Vector3(-30, 20, 30)
  ]);

  useFrame(() => {
    if (isFlying && cameraRef.current) {
      t.current += 0.0015;
      if (t.current > 1) t.current = 0;
      const pos = curve.getPoint(t.current);
      const lookAt = curve.getPoint((t.current + 0.02) % 1);
      cameraRef.current.position.copy(pos);
      cameraRef.current.lookAt(lookAt);
    }
  });

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 45, 70]} />
      <primitive object={scene} />
      {!isFlying && <OrbitControls enableDamping dampingFactor={0.05} maxPolarAngle={Math.PI / 2.1} />}
    </>
  );
}

export default function App() {
  const [appState, setAppState] = useState('gateway');
  const [selectedFile, setSelectedFile] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [modelUrl, setModelUrl] = useState(null);
  const [isFlying, setIsFlying] = useState(false);

  const handleProcess = async () => {
    if (!selectedFile) return;
    setAppState('processing');
    
    const formData = new FormData();
    formData.append('image', selectedFile);
    // Adjusted for realistic urban block heights instead of mountains
    formData.append('min_elev', '10');
    formData.append('max_elev', '150');

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/v1/process-terrain', formData);
      setTelemetry(res.data.telemetry);
      setModelUrl(`http://127.0.0.1:8000${res.data.model_url}`);
      setAppState('dashboard');
    } catch (err) {
      alert("Pipeline failed. Check Python terminal.");
      setAppState('gateway');
    }
  };

  return (
    <div className="h-screen w-screen bg-[#020408] text-slate-200 overflow-hidden relative">
      
      {/* GLOBAL HEADER */}
      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-50 mix-blend-screen">
        <div className="text-xs font-mono text-slate-500 tracking-[0.2em]">DEPTHWIZARD // SIH26175</div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          ENGINE ACTIVE
        </div>
      </header>

      {/* GATEWAY */}
      {appState === 'gateway' && (
        <div className="h-full flex flex-col items-center justify-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>
          
          <div className="flex items-center gap-6 mb-12 z-10">
            <h1 className="text-7xl font-display font-extrabold tracking-widest text-blue-600">DEPTH</h1>
            
            {/* OPTICAL LENS COMPONENT */}
            <div className="relative w-20 h-20 rounded-full border border-blue-500/40 bg-black flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.4)] overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.3)_0%,transparent_70%)]"></div>
              <div className="w-10 h-10 rounded-full border-2 border-blue-400/50 flex items-center justify-center animate-[spin_10s_linear_infinite]">
                <div className="w-8 h-8 rounded-full border border-dashed border-blue-300/60"></div>
              </div>
              <Radar className="absolute text-blue-400 w-5 h-5" />
            </div>

            <h1 className="text-7xl font-display font-extrabold tracking-widest text-blue-600">WIZARD</h1>
          </div>

          <div className="z-10 w-[500px] bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div 
              className="w-full border border-dashed border-white/20 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-300"
              onClick={() => document.getElementById('fileInput').click()}
            >
              <Upload className="text-slate-400 mb-4" size={28} />
              <p className="text-sm font-mono text-slate-400">{selectedFile ? selectedFile.name : "INJECT SINGLE-VIEW TILE"}</p>
              <input type="file" id="fileInput" className="hidden" onChange={(e) => { setSelectedFile(e.target.files[0]); handleProcess(); }} />
            </div>
            
            <button onClick={handleProcess} className={`mt-4 w-full py-3 text-xs font-mono font-bold tracking-widest rounded-xl transition-all ${selectedFile ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-white/5 text-slate-500 cursor-not-allowed'}`}>
              INITIALIZE RECONSTRUCTION
            </button>
          </div>
          
          <p className="absolute bottom-10 text-center text-[10px] font-mono text-slate-500/70 max-w-2xl leading-relaxed uppercase tracking-widest">
            Extracting 3D surface models via learned geometric priors & affine geodetic calibration.
          </p>
        </div>
      )}

      {/* DASHBOARD */}
      {appState === 'dashboard' && (
        <div className="h-full w-full relative">
          <Canvas className="w-full h-full">
            <ambientLight intensity={1.5} />
            <directionalLight position={[100, 150, 50]} intensity={4} color="#ffffff" castShadow />
            <Environment preset="city" />
            <TerrainModel url={modelUrl} isFlying={isFlying} />
          </Canvas>

          {/* TELEMETRY HUD */}
          <div className="absolute top-24 left-8 w-80 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl p-6 shadow-2xl">
            <h3 className="text-[10px] font-mono font-bold text-blue-500 tracking-[0.2em] mb-6 flex items-center gap-2">
              <Crosshair size={12}/> METRIC TELEMETRY
            </h3>
            
            <div className="space-y-4 font-mono text-xs text-slate-300">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-slate-500">DATUM MIN</span> 
                <span className="text-white">{telemetry?.min_elevation_m} M</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-slate-500">DATUM MAX</span> 
                <span className="text-white">{telemetry?.max_elevation_m} M</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-slate-500">NET RELIEF</span> 
                <span className="text-white">{telemetry?.total_relief_m} M</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500">RMSE ERROR</span> 
                <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">±{telemetry?.rmse_m} M</span>
              </div>
            </div>
            
            <div className="mt-8 space-y-3">
              <button onClick={() => setIsFlying(!isFlying)} className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 text-[10px] font-mono font-bold tracking-widest transition-all ${isFlying ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/40'}`}>
                {isFlying ? <Square size={14}/> : <Play size={14}/>}
                {isFlying ? "ABORT AUTOPILOT" : "ENGAGE FLYTHROUGH"}
              </button>
              <button onClick={() => { setAppState('gateway'); setSelectedFile(null); setIsFlying(false); }} className="w-full py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center gap-2 text-[10px] font-mono tracking-widest text-slate-400">
                PURGE & RESTART
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}