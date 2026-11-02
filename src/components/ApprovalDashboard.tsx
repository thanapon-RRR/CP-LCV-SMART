import React, { useState, useEffect } from 'react';
import { User, RequestItem, ApproverRole, ApprovalHistoryItem, VehicleBooking, BuildingBooking } from '../types';
import { Check, X, Shield, FileText, CheckCircle2, UserCheck, Eye, EyeOff, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';

interface ApprovalDashboardProps {
  currentUser: User | null;
  users: User[];
  requests: RequestItem[];
  approverRoles: ApproverRole[];
  vehicleBookings: VehicleBooking[];
  buildingBookings: BuildingBooking[];
  onActionRequest: (requestId: string, step: number, status: 'approved' | 'rejected', comment: string) => void;
  onApproveVehicle?: (id: string, approve: boolean) => void;
  onUpdateVehicleBookings?: React.Dispatch<React.SetStateAction<VehicleBooking[]>> | ((bookings: VehicleBooking[]) => void);
}

export default function ApprovalDashboard({
  currentUser,
  users,
  requests,
  approverRoles,
  vehicleBookings,
  buildingBookings,
  onActionRequest,
  onApproveVehicle,
  onUpdateVehicleBookings
}: ApprovalDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<1 | 2 | 3 | 4>(1); // 1: Leave/Perm, 2: Travel, 3: Subst, 4: Veh/Build
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
  const [selectedVehicleBooking, setSelectedVehicleBooking] = useState<VehicleBooking | null>(null);
  const [comment, setComment] = useState('');
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);

  // Vehicle Head assignment state
  const [driverNameInput, setDriverNameInput] = useState('');
  const [vehicleTypeInput, setVehicleTypeInput] = useState('');

  useEffect(() => {
    if (selectedVehicleBooking) {
      setDriverNameInput(selectedVehicleBooking.driverName || 'รอดำเนินการจัดสรร');
      setVehicleTypeInput(selectedVehicleBooking.vehicleType || 'รถตู้ 1');
    }
  }, [selectedVehicleBooking]);

  // Authenticate approver roles based on currentUser name in approverRoles
  const myAssignedRoles = approverRoles
    .filter(r => r.assignedUserName === currentUser?.name)
    .map(r => r.roleId);

  // Checks if currentUser has specific roleId
  const hasRole = (roleId: string) => myAssignedRoles.includes(roleId);

  // Role checks for specific conditions requested by user
  const isDirector = hasRole('director') || currentUser?.position.includes('ผู้อำนวยการ');
  const isAcademic = hasRole('vice_academic') || hasRole('head_academic') || currentUser?.position.includes('วิชาการ');
  const isPersonnel = hasRole('vice_personnel') || hasRole('head_personnel') || currentUser?.position.includes('บุคคล') || currentUser?.position.includes('ผู้ช่วยผู้อำนวยการกลุ่มบริหารงานบุคคล');
  const isGeneral = hasRole('vice_general') || hasRole('head_general') || currentUser?.position.includes('บริหารทั่วไป') || currentUser?.position.includes('งานทั่วไป');
  const isGeneralAsst = hasRole('assistant_general') || currentUser?.position.includes('ผู้ช่วยผู้อำนวยการกลุ่มบริหารทั่วไป') || currentUser?.position.includes('ผู้ช่วยฯ ฝ่ายทั่วไป');
  const isBudget = hasRole('vice_budget') || hasRole('head_budget') || currentUser?.position.includes('งบประมาณ') || currentUser?.position.includes('แผนงาน');
  const isVehicleHead = hasRole('head_vehicle') || currentUser?.position.includes('ยานพาหนะ');

  // Tab viewing rights
  const canViewTab1 = isDirector || isPersonnel || isGeneral || isBudget;
  const canViewTab2 = isDirector || isPersonnel;
  const canViewTab3 = isDirector || isAcademic;
  const canViewTab4 = isDirector || isGeneral || isGeneralAsst || isVehicleHead;

  // Dynamic filter for Tab 1 (Leave / Permissions)
  const pendingLeaveRequests = requests.filter(r => {
    if (r.status !== 'pending' || r.type === 'travel') return false;
    
    // Check active step approver name
    const currentStepIndex = r.currentApprovalStep - 1;
    const currentStepInfo = r.approvalHistory[currentStepIndex];
    if (!currentStepInfo) return false;

    // Filter rules for General affairs vice / head (only for "ลูกจ้าง" group)
    if (isGeneral && !isDirector && !isPersonnel) {
      if (!r.applicantPosition.includes('ลูกจ้าง')) return false;
    }

    // Filter rules for Budget vice / head (only for "เจ้าหน้าที่พัสดุ" and "เจ้าหน้าที่การเงิน" group)
    if (isBudget && !isDirector && !isPersonnel) {
      if (!['เจ้าหน้าที่พัสดุ', 'เจ้าหน้าที่การเงิน'].includes(r.applicantPosition)) return false;
    }

    // Direct match check
    return currentStepInfo.approverName === currentUser?.name || 
           (isDirector && currentStepInfo.roleName.includes('ผู้อำนวยการ')) ||
           (isPersonnel && currentStepInfo.roleName.includes('บุคคล'));
  });

  // Dynamic filter for Tab 2 (Official Travel)
  const pendingTravelRequests = requests.filter(r => {
    if (r.status !== 'pending' || r.type !== 'travel') return false;
    
    const currentStepIndex = r.currentApprovalStep - 1;
    const currentStepInfo = r.approvalHistory[currentStepIndex];
    if (!currentStepInfo) return false;

    return currentStepInfo.approverName === currentUser?.name || 
           (isDirector && currentStepInfo.roleName.includes('ผู้อำนวยการ')) ||
           (isPersonnel && currentStepInfo.roleName.includes('บุคคล'));
  });

  // Dynamic filter for Tab 3 (Teaching Substitutions)
  const pendingSubstitutionRequests = requests.filter(r => {
    if (r.status !== 'pending' || !r.substitutions || r.substitutions.length === 0) return false;
    
    const currentStepIndex = r.currentApprovalStep - 1;
    const currentStepInfo = r.approvalHistory[currentStepIndex];
    if (!currentStepInfo) return false;

    return currentStepInfo.approverName === currentUser?.name && (isAcademic || isDirector);
  });

  // Dynamic filter for Tab 4 (Vehicles)
  const pendingVehicleBookings = vehicleBookings.filter(v => {
    if (v.status !== 'pending') return false;
    // Approvers for Tab 4: General Vice/Head, Assistant General, Vehicle Head, or Director
    return isDirector || isGeneral || isGeneralAsst || isVehicleHead;
  });

  // Handling click approve / reject on request
  const handleAction = (status: 'approved' | 'rejected') => {
    if (!selectedRequest) return;
    
    if (status === 'rejected' && !comment.trim()) {
      alert('กรุณากรอกความคิดเห็นประกอบเหตุผลสำหรับการปฏิเสธคำร้อง');
      return;
    }

    onActionRequest(selectedRequest.id, selectedRequest.currentApprovalStep, status, comment || 'อนุมัติผ่านระบบเรียบร้อย');
    
    alert(`${status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'} คำร้องขั้นที่ ${selectedRequest.currentApprovalStep} สำเร็จ!`);
    setSelectedRequest(null);
    setComment('');
  };

  // Handling click approve / reject on vehicle booking (Tab 4)
  const handleVehicleAction = (approve: boolean) => {
    if (!selectedVehicleBooking || !onUpdateVehicleBookings) return;

    const updated = vehicleBookings.map(v => {
      if (v.id === selectedVehicleBooking.id) {
        return {
          ...v,
          status: approve ? 'approved' as const : 'rejected' as const,
          driverName: driverNameInput,
          vehicleType: vehicleTypeInput
        };
      }
      return v;
    });

    if (typeof onUpdateVehicleBookings === 'function') {
      onUpdateVehicleBookings(updated);
    }

    alert(`อัปเดตสถานะการจองยานพาหนะเป็น [${approve ? 'อนุมัติ' : 'ปฏิเสธ'}] พร้อมบันทึกพนักงานขับ: "${driverNameInput}" คันรถ: "${vehicleTypeInput}" เรียบร้อย!`);
    setSelectedVehicleBooking(null);
  };

  const isVehicleManager = isVehicleHead || isDirector;

  return (
    <div id="approval-dashboard-tab" className="space-y-6">
      {/* Upper stats summary */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-brand-purple-light flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-1.5">
            <Shield className="w-5 h-5 text-brand-purple" />
            <span>ระบบพิจารณาและอนุมัติใบคำร้องดิจิทัล (Smart Approvals)</span>
          </h3>
          <p className="text-xs text-gray-500">บัญชีล็อกอิน: <strong className="text-gray-800">{currentUser?.name}</strong> | บทบาทตำแหน่ง: <strong className="text-brand-purple">{currentUser?.position}</strong></p>
        </div>

        {/* Roles indicators badges */}
        <div className="flex flex-wrap gap-1.5">
          {myAssignedRoles.map((role, rIdx) => (
            <span key={rIdx} className="bg-purple-100 text-brand-purple-dark px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border border-purple-200">
              ✓ {role.replace('_', ' ')}
            </span>
          ))}
          {isVehicleHead && (
            <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-[10px] font-bold border border-blue-200">
              ✓ หัวหน้างานยานพาหนะ
            </span>
          )}
        </div>
      </div>

      {/* Internal Subtabs for approval category */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {canViewTab1 && (
          <button
            onClick={() => { setActiveSubTab(1); setSelectedRequest(null); setSelectedVehicleBooking(null); }}
            className={`px-4 py-2.5 font-bold text-xs border-b-2 whitespace-nowrap transition ${
              activeSubTab === 1 ? 'border-brand-purple text-brand-purple' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            แท็บ 1: อนุมัติคำร้องลา ({pendingLeaveRequests.length})
          </button>
        )}
        {canViewTab2 && (
          <button
            onClick={() => { setActiveSubTab(2); setSelectedRequest(null); setSelectedVehicleBooking(null); }}
            className={`px-4 py-2.5 font-bold text-xs border-b-2 whitespace-nowrap transition ${
              activeSubTab === 2 ? 'border-brand-purple text-brand-purple' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            แท็บ 2: อนุมัติเดินทางไปราชการ ({pendingTravelRequests.length})
          </button>
        )}
        {canViewTab3 && (
          <button
            onClick={() => { setActiveSubTab(3); setSelectedRequest(null); setSelectedVehicleBooking(null); }}
            className={`px-4 py-2.5 font-bold text-xs border-b-2 whitespace-nowrap transition ${
              activeSubTab === 3 ? 'border-brand-purple text-brand-purple' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            แท็บ 3: อนุมัติจัดการคาบสอนแทน ({pendingSubstitutionRequests.length})
          </button>
        )}
        {canViewTab4 && (
          <button
            onClick={() => { setActiveSubTab(4); setSelectedRequest(null); setSelectedVehicleBooking(null); }}
            className={`px-4 py-2.5 font-bold text-xs border-b-2 whitespace-nowrap transition ${
              activeSubTab === 4 ? 'border-brand-purple text-brand-purple' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            แท็บ 4: อนุมัติจองยานพาหนะ ({pendingVehicleBookings.length})
          </button>
        )}
      </div>

      {/* Core split panel layout: Pending requests list / Details & action form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Pending list (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-brand-purple-light space-y-4">
          <h4 className="font-bold text-sm text-gray-700">รายการรอดำเนินการของคุณ</h4>
          
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {activeSubTab === 1 && (
              pendingLeaveRequests.length === 0 ? (
                <div className="text-center py-10 text-gray-400 font-medium">ไม่มีใบลา/ขออนุญาตค้างอนุมัติในกลุ่มของคุณ</div>
              ) : (
                pendingLeaveRequests.map((r, idx) => (
                  <div
                    key={idx}
                    onClick={() => { setSelectedRequest(r); setSelectedVehicleBooking(null); }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition text-xs space-y-1 text-left ${
                      selectedRequest?.id === r.id ? 'bg-purple-50/50 border-brand-purple shadow-sm' : 'bg-slate-50 border-transparent hover:bg-slate-100/50'
                    }`}
                  >
                    <div className="flex justify-between font-bold text-gray-800">
                      <span>{r.applicantName}</span>
                      <span className="text-brand-purple">ขั้นที่ {r.currentApprovalStep}</span>
                    </div>
                    <p className="text-gray-500 truncate">{r.reason}</p>
                    <div className="flex justify-between items-center pt-1 text-[10px] text-gray-400 font-semibold">
                      <span>วันที่: {r.dateStart} ถึง {r.dateEnd}</span>
                      <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full capitalize">
                        {r.type === 'sick' ? 'ลาป่วย' : r.type === 'personal' ? 'ลากิจ' : r.type === 'out_of_bounds' ? 'ออกนอก' : 'ชี้แจงมาสาย'}
                      </span>
                    </div>
                  </div>
                ))
              )
            )}

            {activeSubTab === 2 && (
              pendingTravelRequests.length === 0 ? (
                <div className="text-center py-10 text-gray-400 font-medium">ไม่มีใบคำร้องไปราชการค้างอนุมัติในกลุ่มของคุณ</div>
              ) : (
                pendingTravelRequests.map((r, idx) => (
                  <div
                    key={idx}
                    onClick={() => { setSelectedRequest(r); setSelectedVehicleBooking(null); }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition text-xs space-y-1 text-left ${
                      selectedRequest?.id === r.id ? 'bg-purple-50/50 border-brand-purple shadow-sm' : 'bg-slate-50 border-transparent hover:bg-slate-100/50'
                    }`}
                  >
                    <div className="flex justify-between font-bold text-gray-800">
                      <span>{r.applicantName}</span>
                      <span className="text-brand-purple">ขั้นที่ {r.currentApprovalStep}</span>
                    </div>
                    <p className="text-gray-500 truncate">ราชการ: {r.reason}</p>
                    <div className="flex justify-between items-center pt-1 text-[10px] text-gray-400 font-semibold">
                      <span>วันที่: {r.dateStart} - {r.dateEnd}</span>
                      <span className="bg-sky-50 text-sky-600 px-2.5 py-0.5 rounded-full">ไปราชการ</span>
                    </div>
                  </div>
                ))
              )
            )}

            {activeSubTab === 3 && (
              pendingSubstitutionRequests.length === 0 ? (
                <div className="text-center py-10 text-gray-400 font-medium">ไม่มีคาบสอนแทนค้างพิจารณาอนุมัติ</div>
              ) : (
                pendingSubstitutionRequests.map((r, idx) => (
                  <div
                    key={idx}
                    onClick={() => { setSelectedRequest(r); setSelectedVehicleBooking(null); }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition text-xs space-y-1 text-left ${
                      selectedRequest?.id === r.id ? 'bg-purple-50/50 border-brand-purple shadow-sm' : 'bg-slate-50 border-transparent hover:bg-slate-100/50'
                    }`}
                  >
                    <div className="flex justify-between font-bold text-gray-800">
                      <span>{r.applicantName}</span>
                      <span>{r.substitutions?.length || 0} คาบสอนแทน</span>
                    </div>
                    <p className="text-gray-500 font-medium">วิชา: {r.substitutions?.[0]?.courseName || 'ทั่วไป'}</p>
                    <div className="flex justify-between items-center pt-1 text-[10px] text-gray-400">
                      <span>วันที่: {r.dateStart}</span>
                      <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">สอนแทน</span>
                    </div>
                  </div>
                ))
              )
            )}

            {activeSubTab === 4 && (
              pendingVehicleBookings.length === 0 ? (
                <div className="text-center py-10 text-gray-400 font-medium">ไม่มีใบคำร้องจองยานพาหนะค้างพิจารณาอนุมัติ</div>
              ) : (
                pendingVehicleBookings.map((v, idx) => (
                  <div
                    key={idx}
                    onClick={() => { setSelectedVehicleBooking(v); setSelectedRequest(null); }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition text-xs space-y-1 text-left ${
                      selectedVehicleBooking?.id === v.id ? 'bg-purple-50/50 border-brand-purple shadow-sm' : 'bg-slate-50 border-transparent hover:bg-slate-100/50'
                    }`}
                  >
                    <div className="flex justify-between font-bold text-gray-800">
                      <span>{v.applicantName}</span>
                      <span className="text-brand-purple font-semibold">{v.vehicleType}</span>
                    </div>
                    <p className="text-gray-500 truncate">จุดหมาย: {v.destination}</p>
                    <div className="flex justify-between items-center pt-1 text-[10px] text-gray-400">
                      <span>เดินทาง: {v.dateStart}</span>
                      <span className="bg-purple-50 text-brand-purple-dark px-2 py-0.5 rounded-full font-bold">ระบบจองรถ</span>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        {/* Right Side: Details & Action form (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-brand-purple-light">
          {activeSubTab === 4 && selectedVehicleBooking ? (
            // Layout for Vehicle Bookings Details & Actions
            <div className="space-y-6 text-xs text-left">
              <div className="pb-4 border-b border-gray-100 flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase font-black text-brand-purple bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full">
                    คำร้องระบบจัดการยานพาหนะและอาคารสถานที่ (Tab 4)
                  </span>
                  <h3 className="text-base font-bold text-gray-800 mt-2">{selectedVehicleBooking.applicantName}</h3>
                  <p className="text-gray-400 text-[11px] mt-0.5">ประเภทการจองรถยนต์ส่วนกลางเพื่อภารกิจโรงเรียน</p>
                </div>

                <div className="text-right">
                  <span className="block text-[10px] text-gray-400">สถานะจอง</span>
                  <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold">รอผู้ดูแลพิจารณา</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase">วัตถุประสงค์ภารกิจ</span>
                  <p className="font-semibold text-gray-800 leading-relaxed text-sm">{selectedVehicleBooking.purpose}</p>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase">ระยะเวลากำหนดการ</span>
                  <p className="font-bold text-gray-700 mt-1">{selectedVehicleBooking.dateStart} ถึง {selectedVehicleBooking.dateEnd}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">เวลาจองรถ: {selectedVehicleBooking.timeStart || '08:30'} - {selectedVehicleBooking.timeEnd || '16:30'} น.</p>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase">จุดหมายปลายทาง</span>
                  <p className="font-bold text-gray-700 mt-1">{selectedVehicleBooking.destination}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">จำนวนผู้ร่วมเดินทาง: {selectedVehicleBooking.passengerCount} คน</p>
                </div>
              </div>

              {/* Editable Fields for Vehicle Head (หัวหน้างานยานพาหนะ) */}
              <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 space-y-4">
                <span className="block text-[11px] font-black text-brand-purple-dark uppercase flex items-center space-x-1">
                  <Sparkles className="w-4 h-4 animate-spin-slow" />
                  <span>สิทธิ์การแก้ไขสำหรับหัวหน้างานยานพาหนะ (Vehicle Allocation Controls)</span>
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-600 font-bold mb-1">พนักงานขับรถ:</label>
                    <input
                      type="text"
                      disabled={!isVehicleManager}
                      value={driverNameInput}
                      onChange={(e) => setDriverNameInput(e.target.value)}
                      placeholder="ใส่ชื่อพนักงานขับรถส่วนกลาง"
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 font-bold text-gray-700 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 font-bold mb-1">เปลี่ยนแปลงประเภท/คันรถที่จอง:</label>
                    <select
                      disabled={!isVehicleManager}
                      value={vehicleTypeInput}
                      onChange={(e) => setVehicleTypeInput(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 font-bold text-gray-700 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <option value="รถตู้ 1">รถตู้ 1 (ฮย-5524 นครราชสีมา)</option>
                      <option value="รถตู้ 2">รถตู้ 2 (นข-8921 นครราชสีมา)</option>
                      <option value="รถหกล้อ 1">รถหกล้อ 1 (6ก-1200 นครราชสีมา)</option>
                      <option value="รถหกล้อ 2">รถหกล้อ 2 (6ก-5544 นครราชสีมา)</option>
                      <option value="รถยนต์ส่วนตัว">รถยนต์ส่วนตัวยื่นขออนุญาตใช้ส่วนตัว</option>
                    </select>
                  </div>
                </div>
                {!isVehicleManager && (
                  <p className="text-[10px] text-gray-400">
                    * คุณไม่มีบทบาทหัวหน้างานยานพาหนะหรือผู้อำนวยการ จึงไม่มีสิทธิ์เลือกพนักงานขับรถ และเปลี่ยนแปลงคันรถที่จองได้
                  </p>
                )}
              </div>

              {/* Action Controls for Vehicle */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4 pt-3.5">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleVehicleAction(false)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-lg transition flex items-center justify-center space-x-1.5 shadow"
                  >
                    <X className="w-4 h-4" />
                    <span>ปฏิเสธการจองรถ</span>
                  </button>
                  <button
                    onClick={() => handleVehicleAction(true)}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-lg transition flex items-center justify-center space-x-1.5 shadow"
                  >
                    <Check className="w-4 h-4" />
                    <span>อนุมัติและบันทึกข้อมูล (Approve & Save)</span>
                  </button>
                </div>
              </div>
            </div>
          ) : selectedRequest === null ? (
            <div className="text-center py-24 text-gray-400 text-xs flex flex-col items-center justify-center space-y-2">
              <UserCheck className="w-16 h-16 text-slate-100" />
              <p className="font-semibold text-gray-500">กรุณาเลือกใบคำร้องทางด้านซ้ายเพื่อดูรายละเอียด</p>
              <p className="text-[10px] text-gray-400 max-w-xs">ระบบจะดึงแผนการอนุมัติ, ตารางการสอนแทน, รวมถึงเอกสารที่แนบ เพื่อประกอบการพิจารณา</p>
            </div>
          ) : (
            <div className="space-y-6 text-xs text-left">
              {/* Header Info */}
              <div className="pb-4 border-b border-gray-100 flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase font-bold text-brand-purple bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full">
                    คำร้องขอ: {selectedRequest.type === 'travel' ? 'ไปราชการ' : 'ลากิจ / ลาเรียน'}
                  </span>
                  <h3 className="text-base font-bold text-gray-800 mt-2">{selectedRequest.applicantName}</h3>
                  <p className="text-gray-400 text-[11px] mt-0.5">{selectedRequest.applicantPosition} | {selectedRequest.applicantGroup}</p>
                </div>

                <div className="text-right">
                  <span className="block text-[10px] text-gray-400">วันที่ยื่นเรื่อง</span>
                  <span className="font-bold text-gray-700">{selectedRequest.createdAt.split('T')[0]}</span>
                </div>
              </div>

              {/* Specific Content details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase">วัตถุประสงค์ / ภารกิจเนื่องจาก</span>
                  <p className="font-medium text-gray-800 leading-relaxed text-sm">{selectedRequest.reason}</p>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase">ระยะเวลากำหนดการ</span>
                  <p className="font-semibold text-gray-700 mt-1">{selectedRequest.dateStart} ถึง {selectedRequest.dateEnd}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">เวลาเดินทาง: {selectedRequest.timeStart} - {selectedRequest.timeEnd} น.</p>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase">สถานที่ปลายทาง / ติดต่อ</span>
                  <p className="font-semibold text-gray-700 mt-1">{selectedRequest.contactAddress}</p>
                </div>

                {selectedRequest.type === 'travel' && (
                  <>
                    <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase">พาหนะเดินทาง</span>
                      <p className="font-semibold text-brand-purple mt-1 capitalize">{selectedRequest.vehicleType}</p>
                      {selectedRequest.vehiclePlate && <p className="text-[11px] text-gray-400">เลขทะเบียน: {selectedRequest.vehiclePlate}</p>}
                      {selectedRequest.driverName && <p className="text-[11px] text-gray-400">คนขับ: {selectedRequest.driverName}</p>}
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase">ค่าชดเชย & งบประมาณ</span>
                      <p className="font-semibold text-gray-700 mt-1">แหล่งงบ: {selectedRequest.budgetSource}</p>
                      <p className="text-[11px] text-gray-400">รวมระยะทางเบิกชดเชย: {selectedRequest.totalDistance || 0} กม. ({selectedRequest.totalCompensation || 0} บาท)</p>
                    </div>
                  </>
                )}
              </div>

              {/* Travel companions list if any */}
              {selectedRequest.companions && selectedRequest.companions.length > 0 && (
                <div className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase">รายชื่อผู้ร่วมเดินทางด้วย ({selectedRequest.companions.length} คน)</span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedRequest.companions.map((comp, cIdx) => (
                      <span key={cIdx} className="bg-white border border-slate-200 text-gray-700 px-2.5 py-1 rounded text-[11px] font-medium">
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Document Attachment Preview if any */}
              {selectedRequest.attachmentUrl && (
                <div className="bg-indigo-50/30 p-3.5 rounded-xl border border-indigo-50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="block text-[10px] font-bold text-indigo-700 uppercase">เอกสารแนบต้นเรื่อง (PDF / Image Preview)</span>
                    <button
                      onClick={() => setShowAttachmentModal(true)}
                      className="text-xs font-bold text-indigo-700 hover:underline flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>ขยายดูใบเอกสารแบบเต็ม</span>
                    </button>
                  </div>
                  <div className="h-44 border border-indigo-100 rounded-lg overflow-hidden flex items-center justify-center bg-slate-100">
                    <img
                      src={selectedRequest.attachmentUrl}
                      alt="Attachment Preview"
                      referrerPolicy="no-referrer"
                      className="object-contain h-full w-full pointer-events-none"
                    />
                  </div>
                </div>
              )}

              {/* Substitutions Section */}
              {selectedRequest.substitutions && selectedRequest.substitutions.length > 0 && (
                <div className="space-y-3">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase">รายการคาบสอนแทนและผู้ลงชื่อตอบรับ</span>
                  <div className="border border-purple-50 rounded-xl overflow-hidden text-[11px]">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-purple-50/50 text-purple-900 border-b border-purple-100">
                        <tr>
                          <th className="p-2.5">คาบ / ชั้น</th>
                          <th className="p-2.5">วิชาที่สอน</th>
                          <th className="p-2.5">ผู้รับภาระสอนแทน</th>
                          <th className="p-2.5 text-center">การยืนยันผู้รับแทน</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-50 bg-white">
                        {selectedRequest.substitutions.map((sub, sIdx) => (
                          <tr key={sIdx}>
                            <td className="p-2.5 font-medium">{sub.period} | ชั้น {sub.className}</td>
                            <td className="p-2.5">{sub.courseCode} {sub.courseName}</td>
                            <td className="p-2.5 font-bold text-purple-700">{sub.substituteTeacherName}</td>
                            <td className="p-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                sub.signed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {sub.signed ? 'เซ็นชื่อรับผิดชอบแล้ว' : 'รอลงชื่อปฏิบัติงานแทน'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Progress Stepper of Approvals */}
              <div className="space-y-3 pt-2">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">ขั้นตอนลำดับสายอนุมัติคำร้อง (Approval History Flow)</span>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  {selectedRequest.approvalHistory.map((hist, hIdx) => {
                    const isPassed = hist.step < selectedRequest.currentApprovalStep;
                    const isCurrent = hist.step === selectedRequest.currentApprovalStep;
                    const isRejected = hist.status === 'rejected';

                    return (
                      <div
                        key={hIdx}
                        className={`p-2.5 rounded-xl border text-center relative ${
                          isRejected ? 'bg-red-50 border-red-200 text-red-700' :
                          isPassed ? 'bg-green-50/50 border-green-200 text-green-700' :
                          isCurrent ? 'bg-purple-50 border-brand-purple text-brand-purple shadow-sm ring-1 ring-brand-purple/20' :
                          'bg-slate-50/50 border-slate-100 text-gray-400'
                        }`}
                      >
                        <span className="block text-[9px] font-bold uppercase">ขั้นที่ {hist.step}</span>
                        <span className="block font-bold truncate text-[10px] mt-0.5">{hist.roleName}</span>
                        <span className="block text-[10px] truncate">{hist.approverName}</span>
                        {isPassed && <span className="text-[9px] font-bold text-green-600 block mt-1">✓ อนุมัติแล้ว</span>}
                        {isCurrent && <span className="text-[9px] font-bold text-brand-purple block mt-1 animate-pulse">● คอยพิจารณา</span>}
                        {isRejected && <span className="text-[9px] font-bold text-red-500 block mt-1">✗ ปฏิเสธ</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Comment and action controls */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4 pt-3.5">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">ความเห็นผู้อนุมัติ (ระบุเพื่อบันทึกในประวัติเอกสาร)</label>
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="ใส่หมายเหตุ หรือเขียนความคิดเห็น (เช่น อนุมัติและเดินทางโดยสวัสดิภาพ, ทราบ)"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 font-semibold text-gray-700"
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAction('rejected')}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-lg transition flex items-center justify-center space-x-1.5 shadow"
                  >
                    <X className="w-4 h-4" />
                    <span>ปฏิเสธคำร้อง (Reject)</span>
                  </button>
                  <button
                    onClick={() => handleAction('approved')}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-lg transition flex items-center justify-center space-x-1.5 shadow"
                  >
                    <Check className="w-4 h-4" />
                    <span>อนุมัติ (Approve)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attachment Expanded Modal (PDF Viewer style) */}
      {showAttachmentModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 p-4 rounded-2xl w-full max-w-2xl h-[550px] shadow-2xl relative flex flex-col justify-between">
            <div className="flex justify-between items-center text-white pb-2 border-b border-slate-800">
              <span className="text-xs font-bold truncate pr-4">หนังสือสำคัญประกอบการเดินทาง: {selectedRequest.attachmentName || 'attachment.pdf'}</span>
              <button
                onClick={() => setShowAttachmentModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1 rounded text-xs"
              >
                ปิดหน้าต่าง
              </button>
            </div>

            <div className="flex-1 bg-slate-950 rounded-lg overflow-auto flex items-center justify-center mt-2">
              <img
                src={selectedRequest.attachmentUrl}
                alt="Document Fullsize"
                className="object-contain max-h-full"
              />
            </div>

            <div className="flex justify-between items-center text-slate-400 text-[10px] pt-2">
              <span>พิจารณาโดย: {currentUser?.name} | เอกสารระบบ CP-LCV SMART</span>
              <span>โรงเรียนชุมพวงศึกษา</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
