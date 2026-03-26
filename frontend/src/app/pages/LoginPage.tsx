import React, { useState, useEffect, useMemo } from 'react';
import { Eye, EyeOff, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

interface FormData {
  name: string;
  email: string;
  password: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
}

export function LoginPage() {
  const [isLogin, setIsLogin] = useState(false);
  const [step, setStep] = useState(1); // 1: Name, 2: Email, 3: Password
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  // 10 custom masonry photos — served from public/masonry/
  const masonryImages = useMemo(() => {
    const localPhotos = Array.from({ length: 10 }).map((_, i) => `/masonry/photo-${i + 1}.jfif`);

    // Explicit column distribution so all 10 unique photos appear on the visible outer columns.
    // The inner columns (behind the modal) receive repeated photos.
    const distribution = [
      0, 1, 2, 3, 4,   // Col 1: Far Left  (photos 1–5, highly visible)
      5, 8, 7, 2, 1,   // Col 2: Inner Left
      8, 9, 0, 4, 2,   // Col 3: Center Left (behind modal)
      3, 1, 5, 6, 7,   // Col 4: Center Right (behind modal)
      0, 9, 3, 6, 4,   // Col 5: Inner Right
      5, 6, 7, 8, 9,   // Col 6: Far Right  (photos 6–10, highly visible)
    ];

    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      height: 250 + (i % 3) * 60 + (i % 2) * 40,
      src: localPhotos[distribution[i]],
    }));
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = (): boolean => {
    const newErrors: FormErrors = {};
    if (isLogin) {
      if (!formData.email.trim()) newErrors.email = 'Username or email is required';
      if (!formData.password) newErrors.password = 'Password is required';
    } else {
      if (step === 1 && !formData.name.trim()) newErrors.name = 'Please tell us your name';
      if (step === 2 && !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid email is required';
      if (step === 3 && formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    setAuthError('');
    setIsSubmitting(true);
    const result = await signup(formData.name.trim(), formData.email.trim(), formData.password);
    setIsSubmitting(false);
    if (result.success) navigate('/');
    else setAuthError(result.error || 'Signup failed');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    setAuthError('');
    setIsSubmitting(true);
    const result = await login(formData.email.trim(), formData.password);
    setIsSubmitting(false);
    if (result.success) navigate('/');
    else setAuthError(result.error || 'Login failed');
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setStep(1);
    setErrors({});
    setAuthError('');
    setFormData({ name: '', email: '', password: '' });
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#f4f5f8] text-gray-900 font-sans">

      {/* ── Masonry Background ── */}
      <div className="absolute inset-0 z-0 bg-gray-100 overflow-hidden">
        <div className="absolute inset-0 bg-white/40 z-10" />
        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4 p-4 opacity-90 scale-105 transform origin-center">
          {masonryImages.map((img) => (
            <div key={img.id} className="mb-4 break-inside-avoid">
              <img
                src={img.src}
                alt="Background visual"
                loading="lazy"
                className="w-full rounded-2xl object-cover shadow-sm"
                style={{ height: `${img.height}px` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Centered Modal ── */}
      <div className="relative z-20 w-full max-w-[480px] min-h-[500px] bg-white rounded-[2rem] shadow-2xl p-10 flex flex-col justify-between m-4 border border-gray-100">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center shadow-md">
            <MapPin className="text-white w-6 h-6" />
          </div>
        </div>

        <div className="flex-1 flex flex-col">

          {/* ── LOGIN MODE ── */}
          {isLogin && (
            <div className="flex flex-col flex-1">
              <h1 className="text-3xl font-bold text-center text-gray-900 mb-8 leading-tight tracking-tight">
                Welcome to <br />Third Place Finder
              </h1>

              <form onSubmit={handleLoginSubmit} className="space-y-4 flex flex-col flex-1" noValidate>
                <div className="relative border border-gray-300 rounded-2xl px-4 pt-6 pb-2 focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-violet-500 transition-all bg-white shadow-sm">
                  <label className="absolute left-4 top-2 text-[11px] text-gray-500 font-medium tracking-wide pointer-events-none">Username or email</label>
                  <input
                    type="text"
                    name="email"
                    autoComplete="username"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full outline-none bg-transparent text-gray-900 placeholder-transparent text-base"
                    placeholder="Username or email"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs font-semibold ml-2">{errors.email}</p>}

                <div className="relative border border-gray-300 rounded-2xl px-4 pt-6 pb-2 focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-violet-500 transition-all bg-white shadow-sm">
                  <label className="absolute left-4 top-2 text-[11px] text-gray-500 font-medium tracking-wide pointer-events-none">Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full outline-none bg-transparent text-gray-900 placeholder-transparent text-base pr-8"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs font-semibold ml-2">{errors.password}</p>}
                {authError && <p className="text-red-500 text-sm font-semibold text-center">{authError}</p>}

                <div className="mt-8">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-4 px-4 rounded-full shadow-md text-base font-semibold text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 transition-all focus:ring-4 focus:ring-violet-200 disabled:opacity-60"
                  >
                    {isSubmitting ? 'Signing in…' : 'Log In'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── SIGN UP MODE (Multi-step) ── */}
          {!isLogin && (
            <div className="flex flex-col flex-1">

              {/* Step 1: Name */}
              {step === 1 && (
                <div className="flex flex-col flex-1">
                  <h1 className="text-4xl font-bold text-center text-gray-900 mb-8 leading-snug tracking-tight">
                    Nice to meet you!<br />What's your name?
                  </h1>
                  <form onSubmit={handleNextStep} className="flex flex-col flex-1" noValidate>
                    <div className="relative border border-gray-300 rounded-2xl px-4 pt-6 pb-2 focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-violet-500 transition-all bg-white shadow-sm">
                      <label className="absolute left-4 top-2 text-[11px] text-gray-500 font-medium tracking-wide pointer-events-none">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        autoFocus
                        className="w-full outline-none bg-transparent text-gray-900 placeholder-transparent text-lg"
                        placeholder="Name"
                      />
                    </div>
                    {errors.name && <p className="text-red-500 text-xs font-semibold mt-2 ml-2">{errors.name}</p>}

                    <div className="flex justify-center gap-2 mt-8 mb-4">
                      <span className="w-2 h-2 rounded-full bg-violet-600" />
                      <span className="w-2 h-2 rounded-full bg-gray-200" />
                      <span className="w-2 h-2 rounded-full bg-gray-200" />
                    </div>

                    <div className="mt-auto pt-4">
                      <button
                        type="submit"
                        className="w-full flex justify-center py-4 px-4 rounded-full shadow-md text-base font-semibold text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 transition-all focus:outline-none focus:ring-4 focus:ring-violet-200"
                      >
                        Continue
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Step 2: Email */}
              {step === 2 && (
                <div className="flex flex-col flex-1">
                  <h1 className="text-4xl font-bold text-center text-gray-900 mb-8 leading-snug tracking-tight">
                    What's your email?
                  </h1>
                  <form onSubmit={handleNextStep} className="flex flex-col flex-1" noValidate>
                    <div className="relative border border-gray-300 rounded-2xl px-4 pt-6 pb-2 focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-violet-500 transition-all bg-white shadow-sm">
                      <label className="absolute left-4 top-2 text-[11px] text-gray-500 font-medium tracking-wide pointer-events-none">Email address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        autoFocus
                        className="w-full outline-none bg-transparent text-gray-900 placeholder-transparent text-lg"
                        placeholder="Email address"
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs font-semibold mt-2 ml-2">{errors.email}</p>}

                    <div className="flex justify-center gap-2 mt-8 mb-4">
                      <span className="w-2 h-2 rounded-full bg-gray-200" />
                      <span className="w-2 h-2 rounded-full bg-violet-600" />
                      <span className="w-2 h-2 rounded-full bg-gray-200" />
                    </div>

                    <div className="mt-auto pt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="py-4 px-6 rounded-full border border-gray-300 bg-white hover:bg-gray-50 transition-colors font-semibold"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="flex-1 flex justify-center py-4 px-4 rounded-full shadow-md text-base font-semibold text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 transition-all focus:outline-none focus:ring-4 focus:ring-violet-200"
                      >
                        Continue
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Step 3: Password */}
              {step === 3 && (
                <div className="flex flex-col flex-1">
                  <h1 className="text-4xl font-bold text-center text-gray-900 mb-8 leading-snug tracking-tight">
                    Create a password
                  </h1>
                  <form onSubmit={handleNextStep} className="flex flex-col flex-1" noValidate>
                    <div className="relative border border-gray-300 rounded-2xl px-4 pt-6 pb-2 focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-violet-500 transition-all bg-white shadow-sm">
                      <label className="absolute left-4 top-2 text-[11px] text-gray-500 font-medium tracking-wide pointer-events-none">Password</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        autoFocus
                        className="w-full outline-none bg-transparent text-gray-900 placeholder-transparent text-lg pr-8"
                        placeholder="Password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs font-semibold mt-2 ml-2">{errors.password}</p>}
                    <p className="text-center text-xs text-gray-500 mt-4">
                      {formData.email} &bull; Not you?{' '}
                      <button type="button" onClick={() => setStep(2)} className="underline text-violet-600 hover:text-violet-800">Change</button>
                    </p>

                    <div className="flex justify-center gap-2 mt-8 mb-4">
                      <span className="w-2 h-2 rounded-full bg-gray-200" />
                      <span className="w-2 h-2 rounded-full bg-gray-200" />
                      <span className="w-2 h-2 rounded-full bg-violet-600" />
                    </div>

                    {authError && <p className="text-red-500 text-sm font-semibold text-center mb-2">{authError}</p>}
                    <div className="mt-auto pt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="py-4 px-6 rounded-full border border-gray-300 bg-white hover:bg-gray-50 transition-colors font-semibold"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 flex justify-center py-4 px-4 rounded-full shadow-md text-base font-semibold text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 transition-all focus:outline-none focus:ring-4 focus:ring-violet-200 disabled:opacity-60"
                      >
                        {isSubmitting ? 'Creating account…' : 'Sign Up'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          )}

        </div>

        {/* ── Footer Toggle ── */}
        <div className="mt-6 pt-6 text-center text-[13px] font-semibold text-gray-700">
          <p>
            {isLogin ? 'Are you new to Third Place Finder? ' : 'Already have an account? '}
            <button onClick={toggleMode} className="text-violet-600 hover:text-violet-800 underline transition-colors">
              {isLogin ? 'Sign up' : 'Log in instead'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
