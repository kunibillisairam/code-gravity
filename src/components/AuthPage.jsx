import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, User, ArrowRight, Loader2, Orbit, ChevronLeft, Sparkles, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup } from 'firebase/auth';

// 3D Point class for canvas calculations
class Point3D {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.baseX = x;
    this.baseY = y;
    this.baseZ = z;
  }

  rotateX(angle) {
    const rad = angle * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const y1 = this.y * cos - this.z * sin;
    const z1 = this.y * sin + this.z * cos;
    this.y = y1;
    this.z = z1;
  }

  rotateY(angle) {
    const rad = angle * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const x1 = this.x * cos + this.z * sin;
    const z1 = -this.x * sin + this.z * cos;
    this.x = x1;
    this.z = z1;
  }

  project(width, height, fov = 350) {
    const cameraDistance = 450;
    const scale = fov / (fov + this.z + cameraDistance);
    const projX = this.x * scale + width / 2;
    const projY = this.y * scale + height / 2;
    return { x: projX, y: projY, scale };
  }
}

const AuthPage = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get('mode') || 'login';

  const [isLogin, setIsLogin] = useState(modeParam === 'login');
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic Theme Accent Color selection
  // Choices: 'cyan' (#00f0ff), 'purple' (#b45aff), 'emerald' (#10b981)
  const [colorAccent, setColorAccent] = useState('cyan');

  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Sync modeParam to local isLogin state
  useEffect(() => {
    setIsLogin(modeParam === 'login');
  }, [modeParam]);

  // Handle Mouse Move for Parallax
  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current.x = (e.clientX - window.innerWidth / 2) / 30;
      mouseRef.current.y = (e.clientY - window.innerHeight / 2) / 30;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 3D Canvas Constellation Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize 3D cloud points (a rotating sphere shell)
    const points = [];
    const count = 120;
    const radius = 220;

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      points.push(new Point3D(x, y, z));
    }

    // Colors mapping
    const accentColors = {
      cyan: { r: 0, g: 240, b: 255 },
      purple: { r: 180, g: 90, b: 255 },
      emerald: { r: 16, g: 185, b: 129 }
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const activeColor = accentColors[colorAccent];

      // Slow constant rotations
      points.forEach(p => {
        p.rotateY(0.18 + mouseRef.current.x * 0.01);
        p.rotateX(0.12 + mouseRef.current.y * 0.01);
      });

      // Project points
      const projected = points.map(p => p.project(canvas.width, canvas.height));

      // Draw lines between close neighbors
      ctx.lineWidth = 0.5;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].x - projected[j].x;
          const dy = projected[i].y - projected[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 95) {
            const opacity = (1 - dist / 95) * 0.16 * projected[i].scale;
            ctx.strokeStyle = `rgba(${activeColor.r}, ${activeColor.g}, ${activeColor.b}, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(projected[i].x, projected[i].y);
            ctx.lineTo(projected[j].x, projected[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw point stars
      projected.forEach(p => {
        ctx.fillStyle = `rgba(${activeColor.r}, ${activeColor.g}, ${activeColor.b}, ${0.4 + p.scale * 0.5})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, 2.2 * p.scale), 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [colorAccent]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      const data = await apiService.googleLogin(idToken);
      if (data.access_token) {
        localStorage.setItem('codegravity_user', data.username);
        localStorage.setItem('codegravity_token', data.access_token);
        onLoginSuccess(data.username);
      }
    } catch (err) {
      setError(err.message || 'Google Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let data;
      if (isLogin) {
        data = await apiService.login(formData.email, formData.password);
      } else {
        data = await apiService.register(formData.username, formData.email, formData.password);
      }
      
      if (data.access_token) {
        localStorage.setItem('codegravity_user', data.username);
        localStorage.setItem('codegravity_token', data.access_token);
        onLoginSuccess(data.username);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Border and glow mapping matching state
  const borderStyles = {
    cyan: 'border-cyber-cyan/30 shadow-[0_0_50px_rgba(0,240,255,0.1)] focus:ring-cyber-cyan',
    purple: 'border-cyber-purple/30 shadow-[0_0_50px_rgba(180,90,255,0.1)] focus:ring-cyber-purple',
    emerald: 'border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.1)] focus:ring-emerald-500'
  };

  const buttonStyles = {
    cyan: 'from-cyber-cyan to-cyber-blue text-space-900 shadow-[0_0_15px_rgba(0,240,255,0.25)] hover:shadow-[0_0_25px_rgba(0,240,255,0.45)]',
    purple: 'from-cyber-purple to-[#4f46e5] text-white shadow-[0_0_15px_rgba(180,90,255,0.25)] hover:shadow-[0_0_25px_rgba(180,90,255,0.45)]',
    emerald: 'from-emerald-500 to-teal-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.45)]'
  };

  const textAccent = {
    cyan: 'text-cyber-cyan',
    purple: 'text-cyber-purple',
    emerald: 'text-emerald-400'
  };

  return (
    <div className="relative w-full min-h-screen bg-[#03050a] flex items-center justify-center overflow-hidden font-sans select-none">
      
      {/* 3D Interactive Stars Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 z-0 pointer-events-none opacity-50 dark:opacity-70"
      />

      {/* Radial overlay gradient for cinematic feel */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#03050a] via-transparent to-[#03050a]/40 pointer-events-none" />

      {/* Floating abstract rings */}
      <div className="absolute top-[20%] left-[15%] w-80 h-80 rounded-full border border-dashed border-white/5 animate-spin-slow pointer-events-none" />
      <div className="absolute bottom-[20%] right-[15%] w-96 h-96 rounded-full border border-dashed border-white/5 animate-spin-reverse pointer-events-none" />

      {/* Accent Color customizer bar */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-3 bg-white/5 backdrop-blur-md px-3.5 py-2 border border-white/10 rounded-full select-none">
        <span className="text-[9px] font-bold font-mono tracking-wider uppercase text-slate-400">Spectrum Matrix:</span>
        <div className="flex gap-2">
          <button 
            onClick={() => setColorAccent('cyan')}
            className={`w-3.5 h-3.5 rounded-full bg-cyber-cyan cursor-pointer transition-transform ${colorAccent === 'cyan' ? 'scale-125 ring-2 ring-white' : ''}`}
            title="Cyan Protocol"
          />
          <button 
            onClick={() => setColorAccent('purple')}
            className={`w-3.5 h-3.5 rounded-full bg-cyber-purple cursor-pointer transition-transform ${colorAccent === 'purple' ? 'scale-125 ring-2 ring-white' : ''}`}
            title="Purple Matrix"
          />
          <button 
            onClick={() => setColorAccent('emerald')}
            className={`w-3.5 h-3.5 rounded-full bg-emerald-500 cursor-pointer transition-transform ${colorAccent === 'emerald' ? 'scale-125 ring-2 ring-white' : ''}`}
            title="Emerald Gateway"
          />
        </div>
      </div>

      {/* Back button */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 right-6 z-20 flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer backdrop-blur-md"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Return Home</span>
      </button>

      {/* Frosted glass cinematic card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`w-full max-w-lg mx-4 bg-[#0a0f1d]/75 backdrop-blur-xl border ${borderStyles[colorAccent]} rounded-2xl p-8 sm:p-10 relative z-10 transition-all duration-500`}
      >
        
        {/* Animated Brand Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg"
            >
              <Orbit className={`w-8 h-8 ${textAccent[colorAccent]} transition-colors duration-500`} />
            </motion.div>
          </div>
          <h2 className="text-2xl font-black text-white font-sans tracking-widest uppercase">
            CODE<span className={textAccent[colorAccent] + " transition-colors duration-500"}>GRAVITY</span>
          </h2>
          <p className="text-[11px] font-mono tracking-widest text-slate-500 uppercase mt-1">
            {isLogin ? 'Quantum Access Terminal' : 'Initialize Developer Node'}
          </p>
        </div>

        {/* Form panel with custom animation */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="signup-username"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-1.5 overflow-hidden"
              >
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-550" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    required={!isLogin}
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-1 focus:border-transparent text-white placeholder-slate-600 text-sm outline-none transition-all"
                    placeholder="e.g. quantum_codex"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-slate-555" />
              </div>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-1 focus:border-transparent text-white placeholder-slate-600 text-sm outline-none transition-all"
                placeholder="developer@codegravity.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Secret Token (Password)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-555" />
              </div>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-1 focus:border-transparent text-white placeholder-slate-600 text-sm outline-none transition-all"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-left font-medium flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Action button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full mt-6 py-3.5 bg-gradient-to-r ${buttonStyles[colorAccent]} font-bold rounded-xl flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer disabled:opacity-75`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span className="font-sans uppercase tracking-widest text-xs font-black">
                  {isLogin ? 'Access Workspace' : 'Initialize Account'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Separator line */}
          <div className="relative my-6 pt-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3.5 bg-[#0a0f1d] text-slate-500 font-mono uppercase tracking-widest text-[9px]">
                Authentication Gateway
              </span>
            </div>
          </div>

          {/* Google Firebase button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 font-bold rounded-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-70 font-sans text-xs uppercase tracking-wider"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span>Google Secure Node</span>
          </button>
        </form>

        {/* Toggle between login and registration */}
        <div className="mt-8 text-center text-xs text-slate-500 font-sans">
          {isLogin ? "New to CodeGravity? " : "Already registered? "}
          <button 
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className={`${textAccent[colorAccent]} transition-colors duration-500 font-bold hover:underline cursor-pointer`}
          >
            {isLogin ? 'Initialize Node' : 'Access Terminal'}
          </button>
        </div>

      </motion.div>
    </div>
  );
};

export default AuthPage;
