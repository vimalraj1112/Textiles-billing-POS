import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Shirt, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();

    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        fieldErrors[key] = issue.message;
      }
      setErrors({ email: fieldErrors.email || '', password: fieldErrors.password || '' });
      return;
    }

    setErrors({ email: '', password: '' });
    setLoading(true);
    try {
      const user = await login(parsed.data);
      toast.success(`Welcome back, ${user.name}`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Shirt className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Mathi Collections</h1>
          <p className="text-sm text-slate-500">Dress Shop POS &amp; Billing System</p>
        </div>
        <form onSubmit={onSubmit} noValidate className="card space-y-4 p-6">
          <div>
            <h2 className="mb-1 text-base font-semibold text-slate-800">Sign in</h2>
            <p className="text-xs text-slate-500">Use your shop credentials to continue</p>
          </div>
          <Input
            label="Email"
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
            }}
            error={errors.email}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
            }}
            error={errors.password}
          />
          <Button type="submit" className="w-full" loading={loading}>
            <Lock className="h-4 w-4" />
            Sign In
          </Button>
          <p className="text-center text-[11px] text-slate-400">
            Demo login: admin@example.com / admin123
          </p>
        </form>
      </div>
    </div>
  );
}