import React, { useState, useEffect, useRef, memo, forwardRef } from 'react';
import { motion, AnimatePresence, useAnimation, useInView, useMotionTemplate, useMotionValue } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, User, ArrowRight, Loader2, Orbit, ChevronLeft, Sparkles, AlertCircle, Code, Terminal, Cpu, Database } from 'lucide-react';
import { apiService } from '../services/api';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup } from 'firebase/auth';

// Utility for combining class names
const cn = (...classes) => classes.filter(Boolean).join(' ');

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

// ==================== Input Component ====================
const Input = memo(
  forwardRef(function Input(
    { className, type, accentColor = '#00f0ff', ...props },
    ref
  ) {
    const radius = 100;
    const [visible, setVisible] = useState(false);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }) {
      const { left, top } = currentTarget.getBoundingClientRect();
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    }

    return (
      <motion.div
        style={{
          background: useMotionTemplate`
            radial-gradient(
              ${visible ? radius + 'px' : '0px'} circle at ${mouseX}px ${mouseY}px,
              ${accentColor},
              transparent 80%
            )
          `,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="group/input rounded-xl p-[1px] transition duration-300 bg-white/5"
      >
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-xl border-none bg-slate-950/60 px-3.5 py-2 text-sm text-white placeholder-slate-650 transition duration-400 group-hover/input:shadow-none focus-visible:ring-[1px] focus-visible:ring-slate-800 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
      </motion.div>
    );
  })
);

Input.displayName = 'Input';

// ==================== BoxReveal Component ====================
const BoxReveal = memo(function BoxReveal({
  children,
  width = 'fit-content',
  boxColor = '#5046e6',
  duration,
  overflow = 'hidden',
  position = 'relative',
  className,
}) {
  const mainControls = useAnimation();
  const slideControls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      slideControls.start('visible');
      mainControls.start('visible');
    } else {
      slideControls.start('hidden');
      mainControls.start('hidden');
    }
  }, [isInView, mainControls, slideControls]);

  return (
    <div
      ref={ref}
      style={{
        position: position,
        width,
        overflow,
      }}
      className={className}
    >
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 35 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        animate={mainControls}
        transition={{ duration: duration ?? 0.5, delay: 0.15 }}
      >
        {children}
      </motion.div>
      <motion.div
        variants={{ hidden: { left: 0 }, visible: { left: '100%' } }}
        initial="hidden"
        animate={slideControls}
        transition={{ duration: duration ?? 0.5, ease: 'easeIn' }}
        style={{
          position: 'absolute',
          top: 2,
          bottom: 2,
          left: 0,
          right: 0,
          zIndex: 20,
          background: boxColor,
          borderRadius: 4,
        }}
      />
    </div>
  );
});

// ==================== Ripple Component ====================
const Ripple = memo(function Ripple({
  mainCircleSize = 160,
  mainCircleOpacity = 0.16,
  numCircles = 8,
  className = '',
  accentColor = '#00f0ff',
}) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center pointer-events-none opacity-50 ${className}`}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 50;
        const opacity = Math.max(0, mainCircleOpacity - i * 0.02);
        const animationDelay = `${i * 0.15}s`;
        const borderStyle = i === numCircles - 1 ? 'dashed' : 'solid';
        const borderOpacity = 10 + i * 5;

        return (
          <span
            key={i}
            className="absolute animate-ripple rounded-full border bg-white/[0.002]"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              opacity: opacity,
              animationDelay: animationDelay,
              borderStyle: borderStyle,
              borderWidth: '1px',
              borderColor: accentColor,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      })}
    </div>
  );
});

// ==================== OrbitingCircles Component ====================
const OrbitingCircles = memo(function OrbitingCircles({
  className,
  children,
  reverse = false,
  duration = 20,
  delay = 10,
  radius = 50,
  path = true,
  accentColor = '#00f0ff',
}) {
  return (
    <>
      {path && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          className="pointer-events-none absolute inset-0 size-full"
        >
          <circle
            className="stroke-white/5 stroke-1"
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            style={{
              stroke: accentColor,
              opacity: 0.12,
            }}
          />
        </svg>
      )}
      <div
        style={{
          '--duration': duration,
          '--radius': radius,
          '--delay': -delay,
        }}
        className={cn(
          'absolute flex transform-gpu animate-orbit items-center justify-center rounded-full',
          { '[animation-direction:reverse]': reverse },
          className
        )}
      >
        {children}
      </div>
    </>
  );
});

// ==================== TechOrbitDisplay Component ====================
const TechOrbitDisplay = memo(function TechOrbitDisplay({
  accentColor = '#00f0ff',
  colorAccent = 'cyan',
}) {
  const iconConfig = [
    // Ring 1 (radius 75)
    { Icon: Orbit, duration: 16, delay: 0, radius: 75, reverse: false },
    { Icon: Sparkles, duration: 16, delay: 8, radius: 75, reverse: false },
    
    // Ring 2 (radius 135)
    { Icon: Code, duration: 24, delay: 4, radius: 135, reverse: true },
    { Icon: Terminal, duration: 24, delay: 16, radius: 135, reverse: true },
    
    // Ring 3 (radius 200)
    { Icon: Cpu, duration: 32, delay: 0, radius: 200, reverse: false },
    { Icon: Database, duration: 32, delay: 16, radius: 200, reverse: false },
  ];

  const textAccent = {
    cyan: 'text-cyber-cyan',
    purple: 'text-cyber-purple',
    emerald: 'text-emerald-400'
  };

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      {/* Ripple backdrop */}
      <Ripple accentColor={accentColor} />

      {/* Central branding */}
      <div className="relative z-10 flex flex-col items-center gap-2 select-none pointer-events-none">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 rounded-2xl bg-[#090e18]/80 border border-white/10 flex items-center justify-center shadow-lg backdrop-blur-md"
        >
          <Orbit className="w-9 h-9" style={{ color: accentColor }} />
        </motion.div>
        <span className="text-4xl font-black tracking-widest text-white mt-3 font-sans">
          CODE<span className={textAccent[colorAccent] + " transition-colors duration-500"}>GRAVITY</span>
        </span>
        <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase">
          Unified Development Node
        </span>
      </div>

      {/* Orbiting Tech Icons */}
      {iconConfig.map((icon, index) => {
        const IconComponent = icon.Icon;
        return (
          <OrbitingCircles
            key={index}
            duration={icon.duration}
            delay={icon.delay}
            radius={icon.radius}
            reverse={icon.reverse}
            accentColor={accentColor}
          >
            <div className="w-10 h-10 rounded-xl bg-[#090d16]/90 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors shadow-lg backdrop-blur-md">
              <IconComponent className="w-4.5 h-4.5" style={{ color: accentColor }} />
            </div>
          </OrbitingCircles>
        );
      })}
    </div>
  );
});

// ==================== Label Component ====================
const Label = memo(function Label({ className, ...props }) {
  return (
    <label
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    />
  );
});

// ==================== BottomGradient Component ====================
const BottomGradient = ({ colorAccent = 'cyan' }) => {
  const gradientColors = {
    cyan: { via1: 'via-cyber-cyan', via2: 'via-cyber-blue' },
    purple: { via1: 'via-cyber-purple', via2: 'via-[#4f46e5]' },
    emerald: { via1: 'via-emerald-500', via2: 'via-teal-650' }
  };
  const activeColors = gradientColors[colorAccent];

  return (
    <>
      <span className={`group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent ${activeColors.via1} to-transparent`} />
      <span className={`group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent ${activeColors.via2} to-transparent`} />
    </>
  );
};

// ==================== Core AuthPage Component ====================
const AuthPage = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get('mode') || 'login';

  const [isLogin, setIsLogin] = useState(modeParam === 'login');
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [visiblePassword, setVisiblePassword] = useState(false);

  // Dynamic Theme Accent Color selection
  // Choices: 'cyan' (#00f0ff), 'purple' (#bd00ff), 'emerald' (#10b981)
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
    const count = 100;
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
      purple: { r: 189, g: 0, b: 255 },
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
            const opacity = (1 - dist / 95) * 0.12 * projected[i].scale;
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
        ctx.fillStyle = `rgba(${activeColor.r}, ${activeColor.g}, ${activeColor.b}, ${0.3 + p.scale * 0.5})`;
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

  // Theme Config definitions matching state selector
  const themeConfig = {
    cyan: {
      accent: '#00f0ff',
      glow: 'rgba(0, 240, 255, 0.12)',
      border: 'border-cyber-cyan/25 shadow-[0_0_50px_rgba(0,240,255,0.06)] focus:ring-cyber-cyan',
      button: 'from-cyber-cyan to-cyber-blue text-space-900 shadow-[0_0_15px_rgba(0,240,255,0.18)] hover:shadow-[0_0_25px_rgba(0,240,255,0.35)]',
      text: 'text-cyber-cyan',
    },
    purple: {
      accent: '#bd00ff',
      glow: 'rgba(189, 0, 255, 0.12)',
      border: 'border-cyber-purple/25 shadow-[0_0_50px_rgba(189,0,255,0.06)] focus:ring-cyber-purple',
      button: 'from-cyber-purple to-[#4f46e5] text-white shadow-[0_0_15px_rgba(189,0,255,0.18)] hover:shadow-[0_0_25px_rgba(189,0,255,0.35)]',
      text: 'text-cyber-purple',
    },
    emerald: {
      accent: '#10b981',
      glow: 'rgba(16, 185, 129, 0.12)',
      border: 'border-emerald-500/25 shadow-[0_0_50px_rgba(16,185,129,0.06)] focus:ring-emerald-500',
      button: 'from-emerald-500 to-teal-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.18)] hover:shadow-[0_0_25px_rgba(16,185,129,0.35)]',
      text: 'text-emerald-400',
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-[#03050a] flex flex-col lg:flex-row overflow-hidden font-sans select-none">
      
      {/* Dynamic inline styles for orbit and ripple animations */}
      <style>{`
        @keyframes orbit {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) translateX(calc(var(--radius) * 1px)) rotate(0deg);
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg) translateX(calc(var(--radius) * 1px)) rotate(-360deg);
          }
        }
        .animate-orbit {
          position: absolute;
          top: 50%;
          left: 50%;
          animation: orbit calc(var(--duration) * 1s) linear infinite;
          animation-delay: calc(var(--delay) * 1s);
        }
        
        @keyframes ripple {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.06);
          }
        }
        .animate-ripple {
          position: absolute;
          top: 50%;
          left: 50%;
          animation: ripple 7s ease-in-out infinite;
        }
      `}</style>

      {/* 3D Interactive Stars Canvas Backdrop (covers the entire screen) */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-60"
      />

      {/* Radial overlay gradient for cinematic feel */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#03050a] via-transparent to-[#03050a]/40 pointer-events-none" />

      {/* LEFT SIDE: Cinematic Orbiting Tech Ecosystem (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative h-screen items-center justify-center border-r border-white/5 overflow-hidden z-10">
        <TechOrbitDisplay 
          accentColor={themeConfig[colorAccent].accent} 
          colorAccent={colorAccent}
        />
      </div>

      {/* RIGHT SIDE: Immersive Authentication Forms */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-center items-center py-12 px-6 sm:px-12 relative z-10 overflow-y-auto">
        
        {/* Return Home & Matrix Customizer controls floating in forms section */}
        <div className="absolute top-6 right-6 flex items-center gap-4 z-20">
          {/* Accent Color customizer bar */}
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 border border-white/10 rounded-full select-none">
            <div className="flex gap-1.5">
              <button 
                onClick={() => setColorAccent('cyan')}
                className={`w-3.5 h-3.5 rounded-full bg-cyber-cyan cursor-pointer transition-transform duration-300 ${colorAccent === 'cyan' ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'}`}
                title="Cyan Protocol"
              />
              <button 
                onClick={() => setColorAccent('purple')}
                className={`w-3.5 h-3.5 rounded-full bg-cyber-purple cursor-pointer transition-transform duration-300 ${colorAccent === 'purple' ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'}`}
                title="Purple Matrix"
              />
              <button 
                onClick={() => setColorAccent('emerald')}
                className={`w-3.5 h-3.5 rounded-full bg-emerald-500 cursor-pointer transition-transform duration-300 ${colorAccent === 'emerald' ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'}`}
                title="Emerald Gateway"
              />
            </div>
          </div>

          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer backdrop-blur-md uppercase tracking-wider"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
        </div>

        {/* Form Container Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className={`w-full max-w-md bg-[#0a0f1d]/75 backdrop-blur-xl border ${themeConfig[colorAccent].border} rounded-2xl p-8 relative transition-all duration-500`}
        >
          
          {/* Header */}
          <div className="mb-6">
            <BoxReveal boxColor={themeConfig[colorAccent].accent} duration={0.3}>
              <h2 className="text-2xl font-black text-white font-sans tracking-wider uppercase">
                {isLogin ? 'Quantum Access' : 'Initialize Node'}
              </h2>
            </BoxReveal>
            <BoxReveal boxColor={themeConfig[colorAccent].accent} duration={0.3} className="mt-1">
              <p className="text-xs text-slate-450">
                {isLogin ? 'Provide your developer token credentials.' : 'Create an account to join the CodeGravity network.'}
              </p>
            </BoxReveal>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin ? (
                <motion.div
                  key="signup-username"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <BoxReveal boxColor={themeConfig[colorAccent].accent} duration={0.3}>
                    <Label htmlFor="username" className="text-[10px] font-bold text-slate-455 uppercase tracking-widest font-mono">
                      Username <span className="text-rose-500">*</span>
                    </Label>
                  </BoxReveal>
                  <BoxReveal boxColor={themeConfig[colorAccent].accent} duration={0.3} width="100%">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                        <User className="h-4 w-4 text-slate-500" />
                      </div>
                      <Input
                        type="text"
                        name="username"
                        id="username"
                        required={!isLogin}
                        value={formData.username}
                        onChange={handleChange}
                        accentColor={themeConfig[colorAccent].accent}
                        className="pl-11"
                        placeholder="e.g. quantum_codex"
                      />
                    </div>
                  </BoxReveal>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="space-y-1.5">
              <BoxReveal boxColor={themeConfig[colorAccent].accent} duration={0.3}>
                <Label htmlFor="email" className="text-[10px] font-bold text-slate-455 uppercase tracking-widest font-mono">
                  Email Address <span className="text-rose-500">*</span>
                </Label>
              </BoxReveal>
              <BoxReveal boxColor={themeConfig[colorAccent].accent} duration={0.3} width="100%">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                    <Mail className="h-4 w-4 text-slate-500" />
                  </div>
                  <Input
                    type="email"
                    name="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    accentColor={themeConfig[colorAccent].accent}
                    className="pl-11"
                    placeholder="developer@codegravity.com"
                  />
                </div>
              </BoxReveal>
            </div>

            <div className="space-y-1.5">
              <BoxReveal boxColor={themeConfig[colorAccent].accent} duration={0.3}>
                <Label htmlFor="password" className="text-[10px] font-bold text-slate-455 uppercase tracking-widest font-mono">
                  Secret Token (Password) <span className="text-rose-500">*</span>
                </Label>
              </BoxReveal>
              <BoxReveal boxColor={themeConfig[colorAccent].accent} duration={0.3} width="100%">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </div>
                  <Input
                    type={visiblePassword ? "text" : "password"}
                    name="password"
                    id="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    accentColor={themeConfig[colorAccent].accent}
                    className="pl-11 pr-10"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setVisiblePassword(!visiblePassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-sm text-slate-500 hover:text-slate-300 transition-colors z-10 cursor-pointer"
                  >
                    {visiblePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </BoxReveal>
            </div>

            {error && (
              <BoxReveal boxColor={themeConfig[colorAccent].accent} duration={0.3} width="100%">
                <motion.div 
                  initial={{ scale: 0.98, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-left font-medium flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              </BoxReveal>
            )}

            {/* Action button */}
            <BoxReveal boxColor={themeConfig[colorAccent].accent} duration={0.3} width="100%" overflow="visible">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full mt-4 py-3.5 bg-gradient-to-r ${themeConfig[colorAccent].button} font-bold rounded-xl flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer disabled:opacity-75 relative group/btn overflow-hidden`}
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
                <BottomGradient colorAccent={colorAccent} />
              </button>
            </BoxReveal>

            {/* Separator line */}
            <BoxReveal boxColor={themeConfig[colorAccent].accent} duration={0.3} width="100%">
              <div className="relative my-4 pt-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-[#0a0f1d]/75 text-slate-500 font-mono uppercase tracking-widest text-[9px]">
                    Authentication Gateway
                  </span>
                </div>
              </div>
            </BoxReveal>

            {/* Google Firebase button */}
            <BoxReveal boxColor={themeConfig[colorAccent].accent} duration={0.3} width="100%" overflow="visible">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 font-bold rounded-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-70 font-sans text-xs uppercase tracking-wider relative group/btn overflow-hidden"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Google Secure Node</span>
                <BottomGradient colorAccent={colorAccent} />
              </button>
            </BoxReveal>
          </form>

          {/* Toggle between login and registration */}
          <div className="mt-6 text-center text-xs text-slate-500 font-sans">
            {isLogin ? "New to CodeGravity? " : "Already registered? "}
            <button 
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className={`${themeConfig[colorAccent].text} transition-colors duration-500 font-bold hover:underline cursor-pointer`}
            >
              {isLogin ? 'Initialize Node' : 'Access Terminal'}
            </button>
          </div>

        </motion.div>
      </div>

    </div>
  );
};

export default AuthPage;
