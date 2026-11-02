import React, { useState } from 'react';
import { User, ApproverRole, VehicleBooking, BuildingBooking, RequestItem } from '../types';
import { Database, Plus, Trash, Edit2, ShieldCheck, Key, Save, RefreshCw, Layers, Check } from 'lucide-react';

const getRoleDetails = (roleId: string) => {
  switch (roleId) {
    case 'director': return { name: 'ผู้อำนวยการโรงเรียน', step: 5 };
    case 'vice_personnel': return { name: 'รองฯ ฝ่ายบริหารงานบุคคล', step: 4 };
    case 'vice_academic': return { name: 'รองฯ ฝ่ายบริหารวิชาการ', step: 4 };
    case 'vice_general': return { name: 'รองฯ ฝ่ายบริหารทั่วไป', step: 4 };
    case 'vice_budget': return { name: 'รองฯ ฝ่ายแผนงานและงบประมาณ', step: 4 };
    case 'head_personnel': return { name: 'หัวหน้างานบริหารงานบุคคล', step: 2 };
    case 'head_academic': return { name: 'หัวหน้างานวิชาการ', step: 2 };
    case 'head_general': return { name: 'หัวหน้างานบริหารทั่วไป', step: 2 };
    case 'head_budget': return { name: 'หัวหน้างานงบประมาณ', step: 2 };
    case 'head_vehicle': return { name: 'หัวหน้างานยานพาหนะ', step: 3 };
    case 'head_saraban': return { name: 'หัวหน้างานสารบรรณ', step: 3 };
    default: return { name: 'ผู้อนุมัติร่วม', step: 1 };
  }
};

interface AdminHubProps {
  currentUser: User | null;
  users: User[];
  approverRoles: ApproverRole[];
  vehicleBookings: VehicleBooking[];
  buildingBookings: BuildingBooking[];
  requests: RequestItem[];
  onUpdateUsers: (newUsers: User[]) => void;
  onUpdateApprovers: (newApprovers: ApproverRole[]) => void;
  onUpdateVehicles: (newVehicles: VehicleBooking[]) => void;
  onUpdateBuildings: (newBuildings: BuildingBooking[]) => void;
  onResetAllData: () => void;
  onSyncGoogleSheets: () => void;
  isSyncing: boolean;
}

export default function AdminHub({
  currentUser,
  users,
  approverRoles,
  vehicleBookings,
  buildingBookings,
  requests,
  onUpdateUsers,
  onUpdateApprovers,
  onUpdateVehicles,
  onUpdateBuildings,
  onResetAllData,
  onSyncGoogleSheets,
  isSyncing
}: AdminHubProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [activeSubTab, setActiveSubTab] = useState<'users' | 'approvers' | 'vehicles' | 'buildings'>('users');

  // Input states for Add/Edit Forms
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<Omit<User, 'id'>>({
    email: '',
    name: '',
    position: 'ครู',
    group: 'กลุ่มสาระการเรียนวิทยาศาสตร์และเทคโนโลยี',
    tel: ''
  });

  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [approverForm, setApproverForm] = useState<{ roleId: string; assignedUserName: string }>({
    roleId: '',
    assignedUserName: ''
  });

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') {
      setUnlocked(true);
      setErrorMsg('');
    } else {
      setErrorMsg('รหัส PIN แอดมินไม่ถูกต้อง!');
    }
  };

  // User Actions
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUserId) {
      // update
      const updated = users.map(u => u.id === editingUserId ? { ...u, ...userForm } : u);
      onUpdateUsers(updated);
      setEditingUserId(null);
    } else {
      // create
      const newUser: User = {
        id: `user-${Date.now()}`,
        ...userForm
      };
      onUpdateUsers([...users, newUser]);
    }
    setUserForm({ email: '', name: '', position: 'ครู', group: 'กลุ่มสาระการเรียนวิทยาศาสตร์และเทคโนโลยี', tel: '' });
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('คุณแน่ใจว่าต้องการลบบัญชีผู้ใช้นี้ออกจากระบบฐานข้อมูล?')) {
      onUpdateUsers(users.filter(u => u.id !== id));
    }
  };

  // Approver Mapping Actions
  const handleSaveApprover = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoleId) {
      const updated = approverRoles.map(a => a.roleId === editingRoleId ? { ...a, assignedUserName: approverForm.assignedUserName } : a);
      onUpdateApprovers(updated);
      setEditingRoleId(null);
    } else {
      if (approverRoles.some(a => a.roleId === approverForm.roleId)) {
        alert('บทบาทนี้มีอยู่แล้วในระบบ! กรุณาใช้วิธีแก้ไขข้อมูลแทน');
        return;
      }
      const newRole: ApproverRole = {
        roleId: approverForm.roleId,
        assignedUserName: approverForm.assignedUserName
      };
      onUpdateApprovers([...approverRoles, newRole]);
    }
    setApproverForm({ roleId: '', assignedUserName: '' });
  };

  const handleDeleteApprover = (roleId: string) => {
    if (confirm('ลบสิทธิ์ผู้อนุมัตินี้หรือไม่?')) {
      onUpdateApprovers(approverRoles.filter(a => a.roleId !== roleId));
    }
  };

  if (!unlocked) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-brand-purple-light max-w-md mx-auto text-center space-y-6">
        <div className="mx-auto w-12 h-12 bg-purple-50 text-brand-purple rounded-full flex items-center justify-center">
          <Key className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-800">ยืนยันตัวตนผู้ดูแลระบบ Master Admin</h3>
          <p className="text-xs text-gray-400 mt-1">ส่วนควบคุมฐานข้อมูลบุคลากร, เส้นทางการวิ่งรถส่วนกลาง และผังบทบาทผู้อนุมัติทั้งหมด</p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="ป้อนรหัส PIN แอดมิน"
              className="w-full text-center bg-slate-50 border border-slate-200 rounded-xl p-3 text-lg font-bold tracking-widest focus:outline-none focus:ring-1 focus:ring-brand-purple"
            />
          </div>
          {errorMsg && <p className="text-[11px] text-red-500 font-semibold">{errorMsg}</p>}
          <button
            type="submit"
            className="w-full bg-brand-purple hover:bg-brand-purple-dark text-white p-3 rounded-xl font-bold text-xs transition shadow-sm"
          >
            เปิดตารางฐานข้อมูล Master Databases
          </button>
        </form>
      </div>
    );
  }

  return (
    <div id="admin-hub-tab" className="space-y-6">
      {/* Master Action Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-brand-purple-light flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-1.5">
            <Database className="w-5 h-5 text-brand-purple" />
            <span>Master Database Control Panel (ฐานข้อมูลโรงเรียน)</span>
          </h3>
          <p className="text-xs text-gray-500">สำหรับ แอดมิน แก้ไขรายชื่อบุคลากรและโครงสร้างการอนุมัติแบบเรียลไทม์ พร้อมระบบ Sync ไปยัง Google Sheets</p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={onSyncGoogleSheets}
            disabled={isSyncing}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-4 py-2 rounded-xl font-bold transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'กำลังเชื่อมข้อมูล...' : 'Sync ไป Google Sheets'}</span>
          </button>

          <button
            onClick={() => {
              if (confirm('คำเตือน! การรีเซ็ตข้อมูลจะทำการล้างคำร้องและการบันทึกทั้งหมด แล้วคืนค่าเริ่มต้น (Initial Seed) ยืนยันหรือไม่?')) {
                onResetAllData();
              }
            }}
            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-xl font-bold transition"
          >
            คืนค่าเริ่มต้นโรงเรียน
          </button>
        </div>
      </div>

      {/* Internal database subtabs */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeSubTab === 'users' ? 'border-brand-purple text-brand-purple' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          บัญชีรายชื่อครูและบุคลากร ({users.length})
        </button>
        <button
          onClick={() => setActiveSubTab('approvers')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeSubTab === 'approvers' ? 'border-brand-purple text-brand-purple' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          แมปปิ้งผู้อนุมัติในสายงาน ({approverRoles.length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        {/* Left Side: Create / Edit Form (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-brand-purple-light space-y-4">
          {activeSubTab === 'users' && (
            <>
              <h4 className="font-bold text-sm text-gray-700">{editingUserId ? 'แก้ไขข้อมูลบุคลากร' : 'เพิ่มบุคลากรใหม่'}</h4>
              <form onSubmit={handleSaveUser} className="space-y-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">ชื่อ - นามสกุล</label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    placeholder="เช่น นายมานะ ยิ่งรวย"
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">อีเมลโรงเรียน (@cp.ac.th)</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="เช่น mana@cp.ac.th"
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">ตำแหน่งราชการ</label>
                  <select
                    value={userForm.position}
                    onChange={(e) => setUserForm({ ...userForm, position: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2.5 font-medium"
                  >
                    <option value="ครู">ครู</option>
                    <option value="ครูอัตราจ้าง">ครูอัตราจ้าง</option>
                    <option value="พนักงานราชการ">พนักงานราชการ</option>
                    <option value="หัวหน้างานบุคลากร">หัวหน้างานบุคลากร</option>
                    <option value="หัวหน้างานสารบรรณ">หัวหน้างานสารบรรณ</option>
                    <option value="รองผู้อำนวยการโรงเรียนกลุ่มบริหารงานบุคคล">รองผู้อำนวยการโรงเรียนกลุ่มบริหารงานบุคคล</option>
                    <option value="รองผู้อำนวยการโรงเรียนกลุ่มบริหารทั่วไป">รองผู้อำนวยการโรงเรียนกลุ่มบริหารทั่วไป</option>
                    <option value="ผู้อำนวยการโรงเรียน">ผู้อำนวยการโรงเรียน</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">กลุ่มสาระฯ / กลุ่มงานสังกัด</label>
                  <select
                    value={userForm.group}
                    onChange={(e) => setUserForm({ ...userForm, group: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2.5 font-medium"
                  >
                    <option value="กลุ่มสาระการเรียนวิทยาศาสตร์และเทคโนโลยี">กลุ่มสาระการเรียนวิทยาศาสตร์และเทคโนโลยี</option>
                    <option value="กลุ่มสาระการเรียนรู้คณิตศาสตร์">กลุ่มสาระการเรียนรู้คณิตศาสตร์</option>
                    <option value="กลุ่มสาระการเรียนรู้ภาษาไทย">กลุ่มสาระการเรียนรู้ภาษาไทย</option>
                    <option value="กลุ่มงานบริหารงานทั่วไป">กลุ่มงานบริหารงานทั่วไป</option>
                    <option value="กลุ่มงานนโยบายและแผน">กลุ่มงานนโยบายและแผน</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">เบอร์โทรศัพท์มือถือ</label>
                  <input
                    type="text"
                    required
                    value={userForm.tel}
                    onChange={(e) => setUserForm({ ...userForm, tel: e.target.value })}
                    placeholder="0812345678"
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2.5"
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  {editingUserId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUserId(null);
                        setUserForm({ email: '', name: '', position: 'ครู', group: 'กลุ่มสาระการเรียนวิทยาศาสตร์และเทคโนโลยี', tel: '' });
                      }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2.5 rounded-lg"
                    >
                      ยกเลิก
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 bg-brand-purple hover:bg-brand-purple-dark text-white py-2.5 rounded-lg font-bold flex items-center justify-center space-x-1"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingUserId ? 'บันทึกอัปเดต' : 'เพิ่มลงสารระบบ'}</span>
                  </button>
                </div>
              </form>
            </>
          )}

          {activeSubTab === 'approvers' && (
            <>
              <h4 className="font-bold text-sm text-gray-700">{editingRoleId ? 'แก้ไขผู้รับผิดชอบบทบาท' : 'กำหนดผู้รับบทบาทอนุมัติ'}</h4>
              <form onSubmit={handleSaveApprover} className="space-y-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">บทบาท / ตำแหน่งผู้อนุมัติ</label>
                  <select
                    value={approverForm.roleId}
                    onChange={(e) => setApproverForm({ ...approverForm, roleId: e.target.value })}
                    required
                    disabled={!!editingRoleId}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2.5"
                  >
                    <option value="">--เลือกประเภทสายงานอนุมัติ--</option>
                    <option value="director">ผู้อำนวยการโรงเรียน (Director)</option>
                    <option value="vice_personnel">รอง ผอ.กลุ่มบริหารงานบุคคล</option>
                    <option value="vice_academic">รอง ผอ.กลุ่มบริหารวิชาการ</option>
                    <option value="vice_general">รอง ผอ.กลุ่มบริหารทั่วไป</option>
                    <option value="head_personnel">หัวหน้างานบุคคล</option>
                    <option value="head_academic">หัวหน้างานวิชาการ</option>
                    <option value="head_vehicle">หัวหน้างานยานพาหนะ</option>
                    <option value="head_general">หัวหน้างานบริหารทั่วไป</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-600 font-semibold mb-1">เลือกบุคลากรที่รับสิทธิ์ตำแหน่งนี้</label>
                  <select
                    value={approverForm.assignedUserName}
                    onChange={(e) => setApproverForm({ ...approverForm, assignedUserName: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-purple-200 rounded-lg p-2.5 font-bold text-brand-purple"
                  >
                    <option value="">--เลือกรายชื่อบุคลากรผู้รับบทบาท--</option>
                    {users.map((u, idx) => (
                      <option key={idx} value={u.name}>{u.name} ({u.position})</option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-2 pt-2">
                  {editingRoleId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRoleId(null);
                        setApproverForm({ roleId: '', assignedUserName: '' });
                      }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2.5 rounded-lg"
                    >
                      ยกเลิก
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 bg-brand-purple hover:bg-brand-purple-dark text-white py-2.5 rounded-lg font-bold flex items-center justify-center space-x-1"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingRoleId ? 'บันทึกอัปเดต' : 'เพิ่มลงสารระบบ'}</span>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Right Side: Database Grid View (8 cols) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-brand-purple-light overflow-x-auto">
          {activeSubTab === 'users' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-gray-500 border-b border-gray-100 font-semibold">
                  <th className="p-3">ชื่อ - นามสกุล</th>
                  <th className="p-3">อีเมลสารสนเทศ</th>
                  <th className="p-3">ตำแหน่ง</th>
                  <th className="p-3">กลุ่มสาระสังกัด</th>
                  <th className="p-3 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/40">
                    <td className="p-3 font-semibold text-gray-800">{u.name}</td>
                    <td className="p-3 text-gray-500 font-mono text-[10px]">{u.email}</td>
                    <td className="p-3 text-gray-700 font-medium">{u.position}</td>
                    <td className="p-3 text-gray-500">{u.group}</td>
                    <td className="p-3 text-center">
                      <div className="flex space-x-2 justify-center">
                        <button
                          onClick={() => {
                            setEditingUserId(u.id);
                            setUserForm({ email: u.email, name: u.name, position: u.position, group: u.group, tel: u.tel });
                          }}
                          className="text-purple-600 hover:bg-purple-50 p-1 rounded"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-red-500 hover:bg-red-50 p-1 rounded"
                          title="ลบ"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeSubTab === 'approvers' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-gray-500 border-b border-gray-100 font-semibold">
                  <th className="p-3">บทบาทผู้อนุมัติ</th>
                  <th className="p-3">ชื่อผู้อนุมัติปฏิบัติหน้าที่</th>
                  <th className="p-3 text-center">ลำดับที่</th>
                  <th className="p-3 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {approverRoles.map((a, idx) => {
                  const details = getRoleDetails(a.roleId);
                  return (
                    <tr key={idx} className="hover:bg-slate-50/40">
                      <td className="p-3 font-semibold text-gray-800">{details.name} ({a.roleId})</td>
                      <td className="p-3 font-bold text-brand-purple">{a.assignedUserName}</td>
                      <td className="p-3 text-center font-semibold text-gray-600">ขั้นตอนที่ {details.step}</td>
                      <td className="p-3 text-center">
                        <div className="flex space-x-2 justify-center">
                          <button
                            onClick={() => {
                              setEditingRoleId(a.roleId);
                              setApproverForm({ roleId: a.roleId, assignedUserName: a.assignedUserName });
                            }}
                            className="text-purple-600 hover:bg-purple-50 p-1 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteApprover(a.roleId)}
                            className="text-red-500 hover:bg-red-50 p-1 rounded"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
