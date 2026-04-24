import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/lib/utils';

const schema = z.object({
  username: z.string().min(3, 'At least 3 characters').max(50),
  email: z.string().email('Invalid email'),
  full_name: z.string().optional(),
  password: z.string().min(8, 'At least 8 characters'),
  password_confirm: z.string().min(1, 'Please confirm password'),
}).refine((d) => d.password === d.password_confirm, {
  message: 'Passwords do not match',
  path: ['password_confirm'],
});
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await registerUser(data);
      toast({
        title: 'Success',
        description: 'Account created! Welcome to FlowForge.',
      });
      navigate('/dashboard');
    } catch (err) {
      toast({
        title: 'Error',
        description: getErrorMessage(err),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-surface-100 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl mb-3 shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
            FlowForge
          </h1>
          <p className="text-surface-500 text-sm mt-1">Create your workspace account</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Username *</label>
                <input {...register('username')} className="input-field" placeholder="john_doe" autoComplete="username" />
                {errors.username && <p className="text-xs text-danger mt-1">{errors.username.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name</label>
                <input {...register('full_name')} className="input-field" placeholder="John Doe" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Email *</label>
              <input {...register('email')} type="email" className="input-field" placeholder="john@example.com" autoComplete="email" />
              {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Password *</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Confirm Password *</label>
              <input
                {...register('password_confirm')}
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="Repeat password"
                autoComplete="new-password"
              />
              {errors.password_confirm && <p className="text-xs text-danger mt-1">{errors.password_confirm.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-surface-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
