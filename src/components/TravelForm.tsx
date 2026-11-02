import React, { useState, useEffect } from 'react';
import { User, RequestItem, TeachingSubstitution } from '../types';
import { Plus, Trash, FileSpreadsheet, Paperclip, CheckCircle2, UserPlus, Users as UsersIcon } from 'lucide-react';

interface TravelFormProps {
  currentUser: User | null;
  users: User[];
  onSubmitRequest: (request: Omit<RequestItem, 'id' | 'status' | 'currentApprovalStep' | 'approvalHistory' | 'createdAt'>) => void;
}

export default function TravelForm({ currentUser, users, onSubmitRequest }: TravelFormProps) {
  // Basic info
  const [applicantName, setApplicantName] = useState(currentUser?.name || '');
  const [applicantTel, setApplicantTel] = useState(currentUser?.tel || '');
  const [applicantPosition, setApplicantPosition] = useState(currentUser?.position || 'ครู');
  const [applicantGroup, setApplicantGroup] = useState(currentUser?.group || 'กลุ่มสาระการเรียนวิทยาศาสตร์และเทคโนโลยี');

  // Companions state
  const [companions, setCompanions] = useState<string[]>([]);
  const [newCompanionName, setNewCompanionName] = useState('');

  // Details
  const [reason, setReason] = useState(''); // เรื่องที่ไป
  const [contactAddress, setContactAddress] = useState(''); // สถานที่จัด
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [timeStart, setTimeStart] = useState('08:30');
  const [timeEnd, setTimeEnd] = useState('16:30');

  // Auto calculate total days
  const [totalDays, setTotalDays] = useState(1);
  useEffect(() => {
    if (dateStart && dateEnd) {
      const d1 = new Date(dateStart);
      const d2 = new Date(dateEnd);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setTotalDays(isNaN(diffDays) ? 1 : diffDays);
    }
  }, [dateStart, dateEnd]);

  // Vehicle type
  const [vehicleType, setVehicleType] = useState<string>('private'); // 'private', 'central_van_1', 'central_van_2', 'central_truck_1', 'central_truck_2', 'public'
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [goDistance, setGoDistance] = useState<number>(0);
  const [returnDistance, setReturnDistance] = useState<number>(0);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [totalCompensation, setTotalCompensation] = useState<number>(0);
  const [driverName, setDriverName] = useState('');

  // Distances auto calc
  useEffect(() => {
    const total = Number(goDistance) + Number(returnDistance);
    setTotalDistance(total);
    setTotalCompensation(total * 4); // 4 Baht per km
  }, [goDistance, returnDistance]);

  // Expenses approval
  const [budgetSource, setBudgetSource] = useState('งบประมาณโครงการ');
  const [claimAllowance, setClaimAllowance] = useState(true);
  const [claimFuel, setClaimFuel] = useState(true);
  const [claimOther, setClaimOther] = useState(false);

  // File Attachment
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // Substitutions
  const [substitutions, setSubstitutions] = useState<Omit<TeachingSubstitution, 'id' | 'signed'>[]>([]);

  // Sync basic info
  useEffect(() => {
    if (currentUser) {
      setApplicantName(currentUser.name);
      setApplicantTel(currentUser.tel);
      setApplicantPosition(currentUser.position);
      setApplicantGroup(currentUser.group);
    }
  }, [currentUser]);

  const deptTeachers = users.filter(u => u.group === applicantGroup && u.name !== applicantName);

  const classrooms: string[] = [];
  for (let grade = 1; grade <= 6; grade++) {
    for (let room = 1; room <= 10; room++) {
      classrooms.push(`ม.${grade}/${room}`);
    }
  }

  // Handle adding companions
  const addCompanion = () => {
    if (newCompanionName.trim()) {
      setCompanions([...companions, newCompanionName.trim()]);
      setNewCompanionName('');
    }
  };

  const removeCompanion = (idx: number) => {
    setCompanions(companions.filter((_, i) => i !== idx));
  };

  // Substitution rows controls
  const addSubRow = () => {
    setSubstitutions([
      ...substitutions,
      {
        teacherName: applicantName,
        period: 'คาบที่ 1 (08:30-09:30)',
        courseCode: '',
        courseName: '',
        assignedTask: '',
        substituteTeacherName: deptTeachers[0]?.name || '',
        className: 'ม.1/1'
      }
    ]);
  };

  const removeSubRow = (index: number) => {
    setSubstitutions(substitutions.filter((_, idx) => idx !== index));
  };

  const updateSubField = (index: number, field: keyof Omit<TeachingSubstitution, 'id' | 'signed'>, value: string) => {
    const updated = [...substitutions];
    updated[index] = { ...updated[index], [field]: value };
    setSubstitutions(updated);
  };

  // Mock File Upload (Read Base64 so approvers can view)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmitRequest({
      type: 'travel',
      applicantName,
      applicantTel,
      applicantPosition,
      applicantGroup,
      reason, // เรื่องที่ไป
      dateStart,
      dateEnd,
      timeStart,
      timeEnd,
      contactAddress, // สถานที่ไปราชการ
      companions,
      vehicleType,
      vehiclePlate: vehicleType === 'private' ? vehiclePlate : undefined,
      goDistance: vehicleType !== 'central_van_1' && vehicleType !== 'central_van_2' && vehicleType !== 'central_truck_1' && vehicleType !== 'central_truck_2' ? goDistance : undefined,
      returnDistance: vehicleType !== 'central_van_1' && vehicleType !== 'central_van_2' && vehicleType !== 'central_truck_1' && vehicleType !== 'central_truck_2' ? returnDistance : undefined,
      totalDistance: vehicleType !== 'central_van_1' && vehicleType !== 'central_van_2' && vehicleType !== 'central_truck_1' && vehicleType !== 'central_truck_2' ? totalDistance : undefined,
      totalCompensation: vehicleType !== 'central_van_1' && vehicleType !== 'central_van_2' && vehicleType !== 'central_truck_1' && vehicleType !== 'central_truck_2' ? totalCompensation : undefined,
      driverName: vehicleType.startsWith('central') ? driverName : undefined,
      budgetSource,
      claimAllowance,
      claimFuel,
      claimOther,
      attachmentUrl: attachmentUrl || undefined,
      attachmentName: attachmentName || undefined,
      substitutions: substitutions.map((s, idx) => ({
        ...s,
        id: `sub-travel-${Date.now()}-${idx}`,
        signed: false
      }))
    });

    // Reset Form
    setReason('');
    setContactAddress('');
    setDateStart('');
    setDateEnd('');
    setCompanions([]);
    setVehiclePlate('');
    setGoDistance(0);
    setReturnDistance(0);
    setDriverName('');
    setAttachmentName('');
    setAttachmentUrl('');
    setSubstitutions([]);

    alert('ยื่นคำร้องขอไปราชการสำเร็จเรียบร้อย! ระบบส่งการแจ้งเตือนไปยังผู้อนุมัติคนแรกแล้ว');
  };

  return (
    <div id="travel-form-tab" className="bg-white p-6 rounded-2xl shadow-sm border border-brand-purple-light space-y-6">
      <div className="border-b border-purple-50 pb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
          <FileSpreadsheet className="w-5 h-5 text-brand-purple" />
          <span>ระบบยื่นคำร้องขออนุมัติเดินทางไปราชการ (Official Travel Form)</span>
        </h3>
        <p className="text-xs text-gray-500">สำหรับยื่นขออนุญาตปฏิบัติราชการนอกสถานที่, แนบหลักฐานเอกสารต้นเรื่อง, และส่งจองยานพาหนะพนักงานขับรถอัตโนมัติ</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Basic Info */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
          <h4 className="font-semibold text-gray-700">1. ข้อมูลผู้ยื่นคำขออนุมัติ</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-600 font-semibold mb-1">ชื่อ - นามสกุล</label>
              <input type="text" value={applicantName} onChange={(e) => setApplicantName(e.target.value)} required className="w-full bg-white border border-gray-200 rounded-lg p-2.5" />
            </div>
            <div>
              <label className="block text-gray-600 font-semibold mb-1">เบอร์โทรศัพท์ติดต่อ</label>
              <input type="text" value={applicantTel} onChange={(e) => setApplicantTel(e.target.value)} required className="w-full bg-white border border-gray-200 rounded-lg p-2.5" />
            </div>
            <div>
              <label className="block text-gray-600 font-semibold mb-1">ตำแหน่ง</label>
              <input type="text" value={applicantPosition} disabled className="w-full bg-gray-50 text-gray-400 border border-gray-200 rounded-lg p-2.5 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-gray-600 font-semibold mb-1">กลุ่มสาระฯ / ฝ่าย</label>
              <input type="text" value={applicantGroup} disabled className="w-full bg-gray-50 text-gray-400 border border-gray-200 rounded-lg p-2.5 cursor-not-allowed" />
            </div>
          </div>
        </div>

        {/* Travel Companions section */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-gray-700 flex items-center space-x-1">
              <UsersIcon className="w-4 h-4 text-brand-purple" />
              <span>2. รายชื่อผู้ร่วมเดินทางไปราชการด้วย (ถ้ามี)</span>
            </h4>
            <span className="bg-brand-purple-light text-brand-purple-dark px-2.5 py-0.5 rounded-full font-bold text-[10px]">
              รวมผู้เดินทางทั้งหมด: {companions.length + 1} คน
            </span>
          </div>

          <div className="flex space-x-2">
            <input
              type="text"
              value={newCompanionName}
              onChange={(e) => setNewCompanionName(e.target.value)}
              placeholder="พิมพ์ ชื่อ-นามสกุล บุคลากรผู้ร่วมเดินทาง"
              className="flex-1 bg-white border border-gray-200 rounded-lg p-2 focus:outline-none"
            />
            <button
              type="button"
              onClick={addCompanion}
              className="bg-brand-purple text-white px-4 py-2 rounded-lg font-bold hover:bg-brand-purple-dark transition flex items-center space-x-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>เพิ่มผู้เดินทาง</span>
            </button>
          </div>

          {companions.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
              {companions.map((comp, index) => (
                <div key={index} className="flex justify-between items-center bg-white border border-gray-200 rounded-lg p-2 shadow-sm text-[11px]">
                  <span className="font-medium text-gray-700">{comp}</span>
                  <button type="button" onClick={() => removeCompanion(index)} className="text-red-400 hover:text-red-600 ml-2">
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Journey details */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
          <h4 className="font-semibold text-gray-700">3. รายละเอียดและกำหนดการเดินทางภารกิจ</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-gray-600 font-semibold mb-1">เดินทางไปราชการเพื่อปฏิบัติภารกิจเรื่อง</label>
              <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} required placeholder="ระบุวัตถุประสงค์ เช่น เข้ารับการจัดงานอบรมพัฒนาครูดิจิทัล" className="w-full bg-white border border-gray-200 rounded-lg p-2.5" />
            </div>
            <div>
              <label className="block text-gray-600 font-semibold mb-1">ณ สถานที่</label>
              <input type="text" value={contactAddress} onChange={(e) => setContactAddress(e.target.value)} required placeholder="ระบุสถานที่ เช่น โรงเรียนนครราชสีมา, มทส." className="w-full bg-white border border-gray-200 rounded-lg p-2.5" />
            </div>
            <div>
              <label className="block text-gray-600 font-semibold mb-1">ตั้งแต่วันที่</label>
              <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} required className="w-full bg-white border border-gray-200 rounded-lg p-2.5" />
            </div>
            <div>
              <label className="block text-gray-600 font-semibold mb-1">ถึงวันที่</label>
              <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} required className="w-full bg-white border border-gray-200 rounded-lg p-2.5" />
            </div>
            <div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-gray-600 font-semibold mb-1">เวลาเดินทางไป-กลับ</label>
                  <div className="flex space-x-1 items-center">
                    <input type="time" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} required className="w-full bg-white border border-gray-200 rounded-lg p-2" />
                    <span>-</span>
                    <input type="time" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} required className="w-full bg-white border border-gray-200 rounded-lg p-2" />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-500 font-medium mb-1">รวม (วัน)</label>
                  <input type="text" value={totalDays} disabled className="w-full bg-gray-100 text-center border border-gray-200 rounded-lg p-2 font-bold text-gray-700 cursor-not-allowed" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transportation choice & Auto distance calculations */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
          <h4 className="font-semibold text-gray-700">4. พาหนะที่ใช้ในการเดินทาง</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-600 font-semibold mb-1">เลือกประเภทพาหนะ</label>
              <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2.5 font-semibold">
                <option value="private">รถยนต์ส่วนตัว (Private Car)</option>
                <option value="central_van_1">รถยนต์ส่วนกลาง - รถตู้ 1</option>
                <option value="central_van_2">รถยนต์ส่วนกลาง - รถตู้ 2</option>
                <option value="central_truck_1">รถยนต์ส่วนกลาง - รถหกล้อ 1</option>
                <option value="central_truck_2">รถยนต์ส่วนกลาง - รถหกล้อ 2</option>
                <option value="public">รถประจำทาง / เครื่องบิน / รถไฟ</option>
              </select>
            </div>

            {/* If Private Car */}
            {vehicleType === 'private' && (
              <>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">หมายเลขทะเบียนรถยนต์</label>
                  <input type="text" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} placeholder="เช่น กข-1234 นครราชสีมา" required className="w-full bg-white border border-gray-200 rounded-lg p-2.5" />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">ระยะทางไป-กลับ (กม.)</label>
                  <div className="flex space-x-1">
                    <input type="number" value={goDistance} onChange={(e) => setGoDistance(Number(e.target.value))} placeholder="ไป" required className="w-1/2 bg-white border border-gray-200 rounded-lg p-2" />
                    <input type="number" value={returnDistance} onChange={(e) => setReturnDistance(Number(e.target.value))} placeholder="กลับ" required className="w-1/2 bg-white border border-gray-200 rounded-lg p-2" />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-500 font-medium mb-1">คำนวณเงินค่าน้ำมันรวม (กิโลเมตรละ 4 บาท)</label>
                  <div className="bg-purple-50 p-2 rounded-lg border border-purple-100 font-bold text-center text-brand-purple text-sm">
                    {totalDistance} กม. | รวม {totalCompensation} บาท
                  </div>
                </div>
              </>
            )}

            {/* If Central Vehicle */}
            {vehicleType.startsWith('central') && (
              <div className="md:col-span-3">
                <label className="block text-gray-600 font-semibold mb-1">ระบุพนักงานขับรถส่วนกลาง</label>
                <input type="text" value={driverName} onChange={(e) => setDriverName(e.target.value)} required placeholder="ระบุชื่อพนักงานขับรถยนต์ เช่น นายสมหวัง ขับเก่ง" className="w-full bg-white border border-gray-200 rounded-lg p-2.5" />
              </div>
            )}

            {/* If Public transport */}
            {vehicleType === 'public' && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-gray-600 font-semibold mb-1">ระยะทางที่คำนวณเบิกชดเชย (กม.)</label>
                  <div className="flex space-x-2">
                    <input type="number" value={goDistance} onChange={(e) => setGoDistance(Number(e.target.value))} placeholder="ระยะทางไป" required className="w-1/2 bg-white border border-gray-200 rounded-lg p-2" />
                    <input type="number" value={returnDistance} onChange={(e) => setReturnDistance(Number(e.target.value))} placeholder="ระยะทางกลับ" required className="w-1/2 bg-white border border-gray-200 rounded-lg p-2" />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-500 font-medium mb-1">รวมค่าชดเชยเดินทาง (ระยะทาง * 4 บาท)</label>
                  <div className="bg-sky-50 p-2 rounded-lg border border-sky-100 font-bold text-center text-brand-blue text-sm">
                    {totalDistance} กม. | รวม {totalCompensation} บาท
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Expenses Approval Section */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
          <h4 className="font-semibold text-gray-700">5. รายละเอียดส่วนขออนุมัติงบประมาณค่าใช้จ่าย</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-gray-600 font-semibold mb-1">แหล่งงบประมาณสนับสนุน</label>
              <select value={budgetSource} onChange={(e) => setBudgetSource(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2.5 font-medium">
                <option value="งบประมาณส่วนกลางของต้นสังกัด">งบประมาณส่วนกลางของต้นสังกัด (สพม. นครราชสีมา)</option>
                <option value="งบประมาณหน่วยงานผู้จัด">งบประมาณหน่วยงานผู้จัด / เจ้าภาพ</option>
                <option value="งบประมาณโครงการ">งบประมาณโครงการ / กลุ่มสาระการเรียนรู้</option>
                <option value="งบประมาณอื่นๆ">งบประมาณส่วนตัว / แหล่งงบประมาณอื่นๆ</option>
              </select>
            </div>
            
            {/* Same row checkbox layout */}
            <div>
              <label className="block text-gray-600 font-semibold mb-2">รายการขอเบิกค่าใช้จ่าย</label>
              <div className="flex space-x-6 bg-white p-2.5 rounded-lg border border-gray-200">
                <label className="flex items-center space-x-2 font-medium text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={claimAllowance} onChange={(e) => setClaimAllowance(e.target.checked)} className="w-4 h-4 text-brand-purple focus:ring-brand-purple border-gray-300 rounded" />
                  <span>ค่าเบี้ยเลี้ยง</span>
                </label>
                <label className="flex items-center space-x-2 font-medium text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={claimFuel} onChange={(e) => setClaimFuel(e.target.checked)} className="w-4 h-4 text-brand-purple focus:ring-brand-purple border-gray-300 rounded" />
                  <span>ค่าน้ำมันเชื้อเพลิง</span>
                </label>
                <label className="flex items-center space-x-2 font-medium text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={claimOther} onChange={(e) => setClaimOther(e.target.checked)} className="w-4 h-4 text-brand-purple focus:ring-brand-purple border-gray-300 rounded" />
                  <span>รายการอื่นๆ</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* File upload attachment */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
          <h4 className="font-semibold text-gray-700">6. เอกสารแนบใบสำคัญประกอบการพิจารณา (หนังสือส่งตัว/หนังสือเชิญ)</h4>
          <div className="flex items-center space-x-4 bg-white p-4 rounded-lg border border-gray-200">
            <Paperclip className="w-8 h-8 text-gray-400" />
            <div className="flex-1">
              <span className="block font-semibold text-gray-700 text-xs">เลือกอัปโหลดหนังสือเชิญเข้าร่วมประชุมหรือเอกสารราชการต้นเรื่อง</span>
              <span className="text-[10px] text-gray-400 block">รองรับไฟล์รูปภาพ (JPG, PNG) หรือไฟล์ PDF ระบบจะแสดงจำลองเป็น PDF Viewer สำหรับคณะผู้พิจารณาอนุมัติ</span>
              <input type="file" onChange={handleFileChange} accept="image/*,application/pdf" className="mt-2 text-xs text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-brand-purple hover:file:bg-purple-100 cursor-pointer" />
            </div>
            {attachmentName && (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full text-[11px] font-bold">
                ✓ {attachmentName}
              </span>
            )}
          </div>
        </div>

        {/* Substitutions */}
        <div className="bg-purple-50/20 p-5 rounded-2xl border border-purple-100 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-purple-900 text-sm">7. รายการมอบหมายหน้าที่สอนแทนกรณีตรงตารางสอน</h4>
              <p className="text-[11px] text-purple-600/70">ระบุคาบวิชาที่คุณมีตารางสอนและมอบหมายให้ครูในกลุ่มสาระเดียวกันทำการสอนแทน</p>
            </div>
            <button
              type="button"
              onClick={addSubRow}
              className="flex items-center space-x-1.5 bg-brand-purple text-white px-3.5 py-1.5 rounded-xl font-bold hover:bg-brand-purple-dark transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มคาบสอนแทน</span>
            </button>
          </div>

          {substitutions.length === 0 ? (
            <div className="text-center py-6 bg-white rounded-xl border border-dashed border-purple-200 text-purple-500/80">
              <span>ไม่มีตารางมอบหมายสอนแทน (กรณีไม่มีภาระคาบสอนตรงในช่วงเวลาที่ไปราชการ)</span>
            </div>
          ) : (
            <div className="space-y-3">
              {substitutions.map((sub, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm relative flex flex-col md:flex-row md:items-center gap-3">
                  <button type="button" onClick={() => removeSubRow(idx)} className="absolute right-3 top-3 text-red-400 hover:text-red-600 transition">
                    <Trash className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-2 md:grid-cols-7 gap-3 w-full pr-6 text-[11px]">
                    <div>
                      <label className="block text-gray-500 font-medium mb-0.5">ครูผู้สอน</label>
                      <input type="text" value={sub.teacherName} disabled className="w-full bg-slate-50 border border-slate-150 rounded p-1.5 font-semibold text-gray-700" />
                    </div>
                    <div>
                      <label className="block text-gray-500 font-medium mb-0.5">คาบที่สอน</label>
                      <select value={sub.period} onChange={(e) => updateSubField(idx, 'period', e.target.value)} className="w-full border border-slate-200 rounded p-1.5 font-medium">
                        <option value="คาบที่ 1 (08:30-09:30)">คาบที่ 1 (08:30-09:30)</option>
                        <option value="คาบที่ 2 (09:30-10:30)">คาบที่ 2 (09:30-10:30)</option>
                        <option value="คาบที่ 3 (10:30-11:30)">คาบที่ 3 (10:30-11:30)</option>
                        <option value="คาบที่ 4 (11:30-12:30)">คาบที่ 4 (11:30-12:30)</option>
                        <option value="คาบที่ 5 (13:00-14:00)">คาบที่ 5 (13:00-14:00)</option>
                        <option value="คาบที่ 6 (14:00-15:00)">คาบที่ 6 (14:00-15:00)</option>
                        <option value="คาบที่ 7 (15:00-16:00)">คาบที่ 7 (15:00-16:00)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-500 font-medium mb-0.5">ชั้นเรียน</label>
                      <select value={sub.className} onChange={(e) => updateSubField(idx, 'className', e.target.value)} className="w-full border border-slate-200 rounded p-1.5 font-medium">
                        {classrooms.map((room, rIdx) => (
                          <option key={rIdx} value={room}>{room}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-500 font-medium mb-0.5">รหัสวิชา</label>
                      <input type="text" required value={sub.courseCode} onChange={(e) => updateSubField(idx, 'courseCode', e.target.value)} placeholder="ว21101" className="w-full border border-slate-200 rounded p-1.5" />
                    </div>
                    <div>
                      <label className="block text-gray-500 font-medium mb-0.5">ชื่อรายวิชา</label>
                      <input type="text" required value={sub.courseName} onChange={(e) => updateSubField(idx, 'courseName', e.target.value)} placeholder="วิทยาศาสตร์ 1" className="w-full border border-slate-200 rounded p-1.5" />
                    </div>
                    <div>
                      <label className="block text-gray-500 font-medium mb-0.5">ภาระงานที่มอบหมาย</label>
                      <input type="text" required value={sub.assignedTask} onChange={(e) => updateSubField(idx, 'assignedTask', e.target.value)} placeholder="ทำแบบทดสอบบทที่ 3" className="w-full border border-slate-200 rounded p-1.5" />
                    </div>
                    <div>
                      <label className="block text-gray-500 font-medium mb-0.5">ผู้รับผิดชอบสอนแทน</label>
                      <select value={sub.substituteTeacherName} onChange={(e) => updateSubField(idx, 'substituteTeacherName', e.target.value)} className="w-full border border-slate-200 rounded p-1.5 font-medium text-brand-purple">
                        {deptTeachers.length === 0 ? (
                          <option value="">ไม่มีครูร่วมกลุ่มสาระอื่น</option>
                        ) : (
                          deptTeachers.map((teach, teachIdx) => (
                            <option key={teachIdx} value={teach.name}>{teach.name}</option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
          <button
            type="reset"
            onClick={() => {
              setReason('');
              setContactAddress('');
              setCompanions([]);
              setVehiclePlate('');
              setGoDistance(0);
              setReturnDistance(0);
              setSubstitutions([]);
            }}
            className="px-6 py-3 border border-slate-200 text-gray-600 rounded-xl font-bold hover:bg-slate-50 transition animate"
          >
            ล้างข้อมูล
          </button>
          <button
            type="submit"
            className="bg-brand-purple hover:bg-brand-purple-dark text-white px-8 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>ส่งคำร้องไปราชการและขออนุมัติงบประมาณ</span>
          </button>
        </div>
      </form>
    </div>
  );
}
