import React, { useState } from 'react';
import { User } from '../types';
import { Shield, Key, UserCheck, UserPlus, Phone, Mail, ChevronLeft, LogIn, RefreshCw } from 'lucide-react';

interface LoginScreenProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
  onRegisterSuccess: (newUser: User) => void;
}

export default function LoginScreen({
  users,
  onLoginSuccess,
  onRegisterSuccess
}: LoginScreenProps) {
  const [view, setView] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginName, setLoginName] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');

  // Registration form state
  const [regName, setRegName] = useState('');
  const [regPosition, setRegPosition] = useState('ครู');
  const [regGroup, setRegGroup] = useState('กลุ่มสาระการเรียนวิทยาศาสตร์และเทคโนโลยี');
  const [regTel, setRegTel] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regError, setRegError] = useState('');

  const positionsList = [
    'ผู้อำนวยการโรงเรียน',
    'รองผู้อำนวยการโรงเรียนกลุ่มบริหารงานบุคคล',
    'รองผู้อำนวยการโรงเรียนกลุ่มบริหารวิชาการ',
    'รองผู้อำนวยการโรงเรียนกลุ่มบริหารทั่วไป',
    'รองผู้อำนวยการโรงเรียนกลุ่มบริหารแผนงานและงบประมาณ',
    'ครู',
    'ครูอัตราจ้าง',
    'พนักงานราชการ',
    'เจ้าหน้าที่ธุรการ',
    'เจ้าหน้าที่พัสดุ',
    'เจ้าหน้าที่การเงิน',
    'Foreign Teacher',
    'ลูกจ้าง',
    'นักศึกษาฝึกประสบการณ์'
  ];

  const groupsList = [
    'ฝ่ายบริหาร',
    'กลุ่มสาระการเรียนรู้คณิตศาสตร์',
    'กลุ่มสาระการเรียนวิทยาศาสตร์และเทคโนโลยี',
    'กลุ่มสาระการเรียนรู้ภาษาไทย',
    'กลุ่มสาระการเรียนรู้สังคมศึกษา',
    'กลุ่มสาระการเรียนรู้การงานอาชีพ',
    'กลุ่มสาระการเรียนรู้สุขศึกษาและพลศึกษา',
    'กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ',
    'กลุ่มสาระการเรียนรู้ศิลปะ',
    'กลุ่มบริหารวิชาการ',
    'กลุ่มบริหารทั่วไป',
    'กลุ่มอำนวยการ',
    'กลุ่มบริหารงานบุคคล',
    'กลุ่มแผนงานและงบประมาณ'
  ];

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const trimmedName = loginName.trim();
    const trimmedPin = loginPin.trim();

    if (!trimmedName || !trimmedPin) {
      setLoginError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const matchedUser = users.find(
      u => u.name.trim() === trimmedName && u.pin.trim() === trimmedPin
    );

    if (matchedUser) {
      onLoginSuccess(matchedUser);
    } else {
      setLoginError('ไม่พบชื่อผู้ใช้ หรือรหัส PIN ไม่ถูกต้อง โปรดตรวจสอบอีกครั้ง');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    const trimmedName = regName.trim();
    const trimmedTel = regTel.trim();
    const trimmedEmail = regEmail.trim();
    const trimmedPin = regPin.trim();

    if (!trimmedName || !trimmedTel || !trimmedPin) {
      setRegError('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    // Special condition: หากเลือกตำแหน่งเป็น "ลูกจ้าง" ไม่จำเป็นต้องกรอกอีเมล
    const isEmployee = regPosition === 'ลูกจ้าง';
    if (!isEmployee && !trimmedEmail) {
      setRegError('ตำแหน่งอื่นจำเป็นต้องกรอกอีเมลในการลงทะเบียน');
      return;
    }

    if (trimmedPin.length !== 4 || isNaN(Number(trimmedPin))) {
      setRegError('รหัส PIN จะต้องเป็นตัวเลข 4 หลักเท่านั้น');
      return;
    }

    // Check if name is already registered
    const existing = users.some(u => u.name.trim() === trimmedName);
    if (existing) {
      setRegError('ชื่อ-นามสกุลนี้มีอยู่ในระบบแล้ว กรุณาเข้าสู่ระบบด้วย PIN หรือใช้ชื่ออื่น');
      return;
    }

    const newUser: User = {
      id: `u-${Date.now()}`,
      name: trimmedName,
      pin: trimmedPin,
      position: regPosition,
      group: regGroup,
      tel: trimmedTel,
      email: isEmployee ? (trimmedEmail || 'ไม่มีอีเมล') : trimmedEmail,
      createdAt: new Date().toISOString()
    };

    onRegisterSuccess(newUser);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-purple-100 overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-purple via-purple-500 to-indigo-500"></div>
        
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex bg-gradient-to-tr from-brand-purple to-purple-600 p-3.5 rounded-2xl text-white shadow-lg mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">CP-LCV SMART</h2>
            <p className="text-xs text-gray-500 font-medium mt-1">ระบบดิจิทัลบริการข้อมูลและสถิติปฏิบัติงาน · โรงเรียนชุมพวงศึกษา</p>
          </div>

          {view === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="text-center mb-2">
                <span className="text-xs font-bold text-brand-purple bg-purple-50 px-3 py-1 rounded-full">
                  ลงชื่อเข้าใช้งานระบบ
                </span>
              </div>

              {loginError && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-semibold p-3.5 rounded-xl text-center">
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-gray-600 font-bold text-xs mb-1.5">ชื่อ-นามสกุลที่ลงทะเบียน</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <UserCheck className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="เช่น นายปัญญา รักเรียน"
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 font-bold text-xs mb-1.5">รหัส PIN 4 หลัก</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="••••"
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm tracking-widest text-center font-bold focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-purple hover:bg-brand-purple-dark text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-purple-500/15 transition flex items-center justify-center space-x-2 text-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>เข้าสู่ระบบ</span>
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-100"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-bold">หรือ</span>
                <div className="flex-grow border-t border-gray-100"></div>
              </div>

              <button
                type="button"
                onClick={() => setView('register')}
                className="w-full bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-1.5"
              >
                <UserPlus className="w-4 h-4 text-brand-purple" />
                <span>ลงทะเบียนผู้ใช้ใหม่</span>
              </button>
            </form>
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="text-center mb-1">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
                  แบบฟอร์มลงทะเบียนครูและบุคลากรใหม่
                </span>
              </div>

              {regError && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-semibold p-3.5 rounded-xl text-center">
                  {regError}
                </div>
              )}

              <div>
                <label className="block text-gray-600 font-bold text-xs mb-1">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น นางสาวรักษ์ไทย เรียนดี"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-bold text-xs mb-1">ตำแหน่ง</label>
                <select
                  value={regPosition}
                  onChange={(e) => setRegPosition(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition"
                >
                  {positionsList.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-600 font-bold text-xs mb-1">กลุ่มสาระการเรียนรู้ / กลุ่มงาน</label>
                <select
                  value={regGroup}
                  onChange={(e) => setRegGroup(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition"
                >
                  {groupsList.map((grp) => (
                    <option key={grp} value={grp}>
                      {grp}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-600 font-bold text-xs mb-1">เบอร์โทรศัพท์</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Phone className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="เช่น 089-xxxxxxx"
                    value={regTel}
                    onChange={(e) => setRegTel(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-gray-600 font-bold text-xs">อีเมล</label>
                  {regPosition === 'ลูกจ้าง' && (
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                      ไม่ต้องกรอกอีเมลได้
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Mail className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="email"
                    required={regPosition !== 'ลูกจ้าง'}
                    placeholder={regPosition === 'ลูกจ้าง' ? "ไม่บังคับสำหรับลูกจ้าง" : "เช่น somchai@cp.ac.th"}
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 font-bold text-xs mb-1">กำหนด PIN 4 หลัก (เพื่อเข้าสู่ระบบ)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Key className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="กำหนดตัวเลข 4 ตัว"
                    value={regPin}
                    onChange={(e) => setRegPin(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs text-center font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition"
                  />
                </div>
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-gray-600 font-bold py-2.5 px-3 rounded-xl text-xs transition flex items-center justify-center space-x-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>ย้อนกลับ</span>
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-brand-purple hover:bg-brand-purple-dark text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow transition flex items-center justify-center space-x-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>ลงทะเบียนผู้ใช้ใหม่</span>
                </button>
              </div>
            </form>
          )}

          {/* App Info footer */}
          <div className="mt-6 pt-5 border-t border-purple-50 text-center">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
              ระบบดิจิทัลบริการอัจฉริยะ โรงเรียนชุมพวงศึกษา
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
