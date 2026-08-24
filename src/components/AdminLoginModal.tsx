import React, { useState } from 'react';
import { X, Lock, KeyRound, ShieldCheck, AlertCircle, LogOut } from 'lucide-react';
import { useSongs, ADMIN_CORRECT_PIN } from '../context/SongContext';

export const AdminLoginModal: React.FC = () => {
  const {
    isAdmin,
    isAdminModalOpen,
    closeAdminModal,
    loginAdmin,
    logoutAdmin,
    adminPinError,
  } = useSongs();

  const [pinInput, setPinInput] = useState('');

  if (!isAdminModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = loginAdmin(pinInput);
    if (success) {
      setPinInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-600/20 border border-red-500/30 rounded-xl text-red-500">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>เข้าสู่ระบบ Admin</span>
                <span className="text-[10px] font-mono bg-neutral-800 text-neutral-300 border border-neutral-700 px-2 py-0.5 rounded-full">
                  Security
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                ระบบจัดการ เพิ่ม ลบ แก้ไข เพลง และเนื้อเพลงวง TRIPLETS
              </p>
            </div>
          </div>

          <button
            onClick={closeAdminModal}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {isAdmin ? (
            /* Logged in state */
            <div className="text-center space-y-4 py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-950/50">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">คุณเข้าสู่ระบบ Admin เรียบร้อยแล้ว</h4>
                <p className="text-xs text-neutral-400">
                  สิทธิ์ผู้ดูแลระบบ (Admin) มีผลสมบูรณ์แล้ว คุณสามารถเพิ่ม ลบ และแก้ไขเนื้อเพลงได้ทันทีในสตรีมเพลง
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={closeAdminModal}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  ไปที่หน้าจัดการเพลง
                </button>
                <button
                  onClick={logoutAdmin}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            </div>
          ) : (
            /* Login Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider block">
                  กรอกรหัสผ่าน Admin (PIN 6 หลัก):
                </label>
                
                <div className="relative">
                  <input
                    type="password"
                    maxLength={10}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="กรอกรหัสผ่าน Admin"
                    className="w-full bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-widest text-white focus:outline-none shadow-inner"
                    autoFocus
                  />
                  <KeyRound className="w-5 h-5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                <p className="text-[11px] text-neutral-400 text-center font-mono">
                  * กรุณากรอกรหัสผ่าน PIN เพื่อเข้าใช้งานระบบผู้ดูแลระบบ
                </p>
              </div>

              {adminPinError && (
                <div className="bg-red-950/80 border border-red-800 rounded-xl p-3 flex items-center gap-2.5 text-xs text-red-300 animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                  <span>{adminPinError}</span>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={closeAdminModal}
                  className="w-1/3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-red-950/60 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>ยืนยันรหัสผ่าน</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950 text-[11px] text-neutral-500 text-center font-mono">
          TRIPLETS Official Admin Security System
        </div>

      </div>
    </div>
  );
};
