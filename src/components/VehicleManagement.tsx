import React, { useState } from 'react';
import { User, VehicleBooking, BuildingBooking } from '../types';
import { Car, Building, ShieldAlert, Key, Filter, CheckCircle2, XCircle } from 'lucide-react';

interface VehicleManagementProps {
  currentUser: User | null;
  vehicleBookings: VehicleBooking[];
  buildingBookings: BuildingBooking[];
  onApproveVehicle: (id: string, approve: boolean) => void;
  onApproveBuilding: (id: string, approve: boolean) => void;
}

export default function VehicleManagement({
  currentUser,
  vehicleBookings,
  buildingBookings,
  onApproveVehicle,
  onApproveBuilding
}: VehicleManagementProps) {
  // Login Lock state
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Academic Year Filter
  const [acadYear, setAcadYear] = useState('2569');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    // Authorized roles: 'รองผู้อำนวยการโรงเรียนกลุ่มบริหารทั่วไป', 'ผู้อำนวยการโรงเรียน' or PIN "1234"
    if (pin === '1234' || (currentUser && (currentUser.position.includes('ทั่วไป') || currentUser.position.includes('ผู้อำนวยการ')))) {
      setUnlocked(true);
      setErrorMsg('');
    } else {
      setErrorMsg('PIN รหัสผ่านไม่ถูกต้อง หรือคุณไม่มีสิทธิ์เข้าถึงส่วนงานจัดการยานพาหนะและอาคาร');
    }
  };

  // Safe checks: If already logged in as Director or General Vice, bypass lock
  React.useEffect(() => {
    if (currentUser && (currentUser.position.includes('ทั่วไป') || currentUser.position.includes('ผู้อำนวยการ'))) {
      setUnlocked(true);
    }
  }, [currentUser]);

  // Combined vehicles sorted by date
  const filteredVehicles = vehicleBookings
    .filter(() => acadYear === '2569') // simplify year filter for mock demo
    .sort((a, b) => b.dateStart.localeCompare(a.dateStart));

  const filteredBuildings = buildingBookings
    .filter(() => acadYear === '2569')
    .sort((a, b) => b.dateStart.localeCompare(a.dateStart));

  if (!unlocked) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-brand-purple-light max-w-md mx-auto text-center space-y-6">
        <div className="mx-auto w-12 h-12 bg-purple-50 text-brand-purple rounded-full flex items-center justify-center">
          <Key className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-800">ยืนยันรหัสผ่านเพื่อสิทธิ์ผู้ดูแลยานพาหนะ</h3>
          <p className="text-xs text-gray-400 mt-1">สงวนไว้สำหรับ หัวหน้างานยานพาหนะ, รอง ผอ.กลุ่มบริหารทั่วไป และแอดมินระบบเท่านั้น</p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="กรอกรหัส PIN 4 หลัก (เช่น 1234)"
              className="w-full text-center bg-slate-50 border border-slate-200 rounded-xl p-3 text-lg font-bold tracking-widest focus:outline-none focus:ring-1 focus:ring-brand-purple"
            />
          </div>
          {errorMsg && <p className="text-[11px] text-red-500 font-semibold">{errorMsg}</p>}
          <button
            type="submit"
            className="w-full bg-brand-purple hover:bg-brand-purple-dark text-white p-3 rounded-xl font-bold text-xs transition shadow-sm"
          >
            เข้าสู่ระบบผู้พิจารณายานพาหนะ/อาคาร
          </button>
        </form>
      </div>
    );
  }

  return (
    <div id="vehicle-management-tab" className="space-y-6">
      {/* Title & Filter */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-brand-purple-light flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">ระบบบริหารจัดการและอนุมัติจองรถยนต์ & อาคาร</h3>
          <p className="text-xs text-gray-500">ตรวจสอบคำร้องจองรถยนต์และสถานที่ ทั้งจากคำร้องไปราชการและแบบฟอร์มจองตรง</p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-gray-500">ปีการศึกษา:</span>
          <select
            value={acadYear}
            onChange={(e) => setAcadYear(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
          >
            <option value="2569">2569</option>
            <option value="2568">2568</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicles Table panel */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-purple-light space-y-4">
          <div className="flex items-center space-x-2 text-gray-800">
            <Car className="w-5 h-5 text-brand-purple" />
            <h4 className="font-bold text-sm">รายการคำร้องจองรถยนต์ส่วนกลางทั้งหมด</h4>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-gray-500 border-b border-gray-100">
                  <th className="p-3">ผู้ยื่นคำขอ</th>
                  <th className="p-3">สถานที่ & ภารกิจ</th>
                  <th className="p-3">ประเภทรถ / คนขับ</th>
                  <th className="p-3 text-center">สถานะ</th>
                  <th className="p-3 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-400">ยังไม่มีรายการจองรถยนต์เข้ามา</td>
                  </tr>
                ) : (
                  filteredVehicles.map((v, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-gray-800">
                        {v.applicantName}
                        <span className="block text-[10px] text-gray-400 font-normal">{v.dateStart} | คนเดินทาง: {v.passengerCount} คน</span>
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-gray-700">{v.destination}</span>
                        <span className="block text-[10px] text-gray-400 truncate max-w-[150px]">{v.purpose}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-brand-purple">{v.vehicleType}</span>
                        <span className="block text-[10px] text-gray-500 font-medium">พขร: {v.driverName || 'รอดำเนินการ'}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.status === 'approved' ? 'bg-green-100 text-green-700' :
                          v.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {v.status === 'approved' ? 'อนุมัติแล้ว' : v.status === 'rejected' ? 'ปฏิเสธ' : 'รอพิจารณา'}
                        </span>
                      </td>
                      <td className="p-3">
                        {v.status === 'pending' && (
                          <div className="flex space-x-1.5 justify-center">
                            <button
                              onClick={() => onApproveVehicle(v.id, true)}
                              className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded"
                              title="อนุมัติ"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onApproveVehicle(v.id, false)}
                              className="text-red-500 hover:bg-red-50 p-1.5 rounded"
                              title="ไม่อนุมัติ"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Buildings Table panel */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-purple-light space-y-4">
          <div className="flex items-center space-x-2 text-gray-800">
            <Building className="w-5 h-5 text-brand-blue" />
            <h4 className="font-bold text-sm">รายการขออนุมัติใช้อาคารสถานที่</h4>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-gray-500 border-b border-gray-100">
                  <th className="p-3">ผู้ขอใช้</th>
                  <th className="p-3">อาคาร / สถานที่</th>
                  <th className="p-3">วันที่ & เวลาภารกิจ</th>
                  <th className="p-3 text-center">สถานะ</th>
                  <th className="p-3 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredBuildings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-400">ยังไม่มีคำขอใช้อาคารสถานที่เข้ามา</td>
                  </tr>
                ) : (
                  filteredBuildings.map((b, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-gray-800">{b.applicantName}</td>
                      <td className="p-3">
                        <span className="font-semibold text-brand-blue">{b.buildingName}</span>
                        <span className="block text-[10px] text-gray-400 truncate max-w-[150px]">{b.purpose}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-gray-700">{b.dateStart}</span>
                        <span className="block text-[10px] text-gray-500 font-semibold">{b.timeStart} - {b.timeEnd} น.</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.status === 'approved' ? 'bg-green-100 text-green-700' :
                          b.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {b.status === 'approved' ? 'อนุมัติแล้ว' : b.status === 'rejected' ? 'ปฏิเสธ' : 'รอพิจารณา'}
                        </span>
                      </td>
                      <td className="p-3">
                        {b.status === 'pending' && (
                          <div className="flex space-x-1.5 justify-center">
                            <button
                              onClick={() => onApproveBuilding(b.id, true)}
                              className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded"
                              title="อนุมัติ"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onApproveBuilding(b.id, false)}
                              className="text-red-500 hover:bg-red-50 p-1.5 rounded"
                              title="ไม่อนุมัติ"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
