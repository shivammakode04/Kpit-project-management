import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Camera, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';
import { getErrorMessage } from '@/lib/utils';
import Avatar from '@/components/common/Avatar';

const profileSchema = z.object({ full_name: z.string().optional(), email: z.string().email('Invalid email') });
const pwSchema = z.object({
  old_password: z.string().min(1, 'Required'),
  new_password: z.string().min(8, 'Min 8 characters'),
  new_password_confirm: z.string(),
}).refine((d) => d.new_password === d.new_password_confirm, { message: 'Passwords do not match', path: ['new_password_confirm'] });

type ProfileForm = z.infer<typeof profileSchema>;
type PwForm = z.infer<typeof pwSchema>;

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  const { register: regProfile, handleSubmit: handleProfile, formState: { errors: profileErrors, isSubmitting: profileSaving } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: user?.full_name ?? '', email: user?.email ?? '' },
  });

  const { register: regPw, handleSubmit: handlePw, formState: { errors: pwErrors, isSubmitting: pwSaving }, reset: resetPw } = useForm<PwForm>({
    resolver: zodResolver(pwSchema),
  });

  const onSaveProfile = async (data: ProfileForm) => {
    try {
      const { data: updated } = await authApi.updateProfile(data);
      updateUser(updated);
      toast.success('Profile updated!');
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const onChangePassword = async (data: PwForm) => {
    try {
      await authApi.changePassword(data);
      toast.success('Password changed!');
      resetPw();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    try {
      const { data } = await authApi.uploadAvatar(file);
      updateUser(data);
      toast.success('Avatar updated!');
    } catch (err) {
      setAvatarPreview(null);
      toast.error(getErrorMessage(err));
    }
    e.target.value = '';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Profile Settings</h1>

      {/* Avatar */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 flex items-center gap-6">
        <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
          <Avatar
            name={user?.full_name || user?.username || ''}
            src={avatarPreview ?? user?.avatar_url}
            size="xl"
          />
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        <div>
          <h2 className="font-semibold text-lg">{user?.full_name || user?.username}</h2>
          <p className="text-surface-500 text-sm">{user?.email}</p>
          <span className="inline-block mt-1 text-xs bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 px-2 py-0.5 rounded-full capitalize font-semibold">{user?.role}</span>
        </div>
      </motion.div>

      {/* Edit Profile */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-6">
        <h2 className="font-semibold mb-4">Edit Profile</h2>
        <form onSubmit={handleProfile(onSaveProfile)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Full Name</label>
            <input {...regProfile('full_name')} className="input-field" placeholder="Your full name" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input {...regProfile('email')} type="email" className="input-field" />
            {profileErrors.email && <p className="text-xs text-danger mt-1">{profileErrors.email.message}</p>}
          </div>
          <button type="submit" disabled={profileSaving} className="btn-primary">
            {profileSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </motion.div>

      {/* Change Password */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
        <h2 className="font-semibold mb-4">Change Password</h2>
        <form onSubmit={handlePw(onChangePassword)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Current Password</label>
            <input {...regPw('old_password')} type="password" className="input-field" placeholder="••••••••" />
            {pwErrors.old_password && <p className="text-xs text-danger mt-1">{pwErrors.old_password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">New Password</label>
            <div className="relative">
              <input {...regPw('new_password')} type={showPw ? 'text' : 'password'} className="input-field pr-10" placeholder="Min. 8 characters" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {pwErrors.new_password && <p className="text-xs text-danger mt-1">{pwErrors.new_password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Confirm New Password</label>
            <input {...regPw('new_password_confirm')} type={showPw ? 'text' : 'password'} className="input-field" placeholder="Repeat new password" />
            {pwErrors.new_password_confirm && <p className="text-xs text-danger mt-1">{pwErrors.new_password_confirm.message}</p>}
          </div>
          <button type="submit" disabled={pwSaving} className="btn-primary">
            {pwSaving ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
