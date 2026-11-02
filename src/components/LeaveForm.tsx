import React, { useState, useEffect } from 'react';
import { User, RequestItem, TeachingSubstitution } from '../types';
import { INITIAL_USERS } from '../data';
import { Plus, Trash, FileText, CheckCircle, HelpCircle } from 'lucide-react';

interface LeaveFormProps {
  currentUser: User | null;
  users: User[];
  onSubmitRequest: (request: Omit<RequestItem, 'id' | 'status' | 'currentApprovalStep' | 'approvalHistory' | 'createdAt'>) => void;
}

export default function LeaveForm({ currentUser, users, onSubmitRequest }: LeaveFormProps) {
  // Common states
  const [applicantName, setApplicantName] = useState(currentUser?.name || '');
  const [applicantTel, setApplicantTel] = useState(currentUser?.tel || '');
  const [applicantPosition, setApplicantPosition] = useState(currentUser?.position || 'ครู');
  const [applicantGroup, setApplicantGroup] = useState(currentUser?.group || 'กลุ่มสาระการเรียนวิทยาศาสตร์และเทคโนโลยี');
  
  // Form Type
  const [type, setType] = useState<'sick' | 'personal' | 'maternity' | 'ordination' | 'out_of_bounds' | 'attendance' | 'return_time'>('sick');
  
  // Specific Form states
  const [reason, setReason] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [witnessName, setWitnessName] = useState('');

  // Teaching substitution state rows
  const [substitutions, setSubstitutions] = useState<Omit<TeachingSubstitution, 'id' | 'signed'>[]>([]);

  // Auto-fill when currentUser logs in
  useEffect(() => {
    if (currentUser) {
      setApplicantName(currentUser.name);
      setApplicantTel(currentUser.tel);
      setApplicantPosition(currentUser.position);
      setApplicantGroup(currentUser.group);
    }
  }, [currentUser]);

  // List of teachers in the SAME department/group as candidate substitutes
  const deptTeachers = users.filter(u => u.group === applicantGroup && u.name !== applicantName);

  // Classrooms generation ม.1/1 - ม.6/10
  const classrooms: string[] = [];
  for (let grade = 1; grade <= 6; grade++) {
    for (let room = 1; room <= 10; room++) {
      classrooms.push(`ม.${grade}/${room}`);
    }
  }

  // Handle adding substitute teaching row
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

  // Handle deleting substitute teaching row
  const removeSubRow = (index: number) => {
    setSubstitutions(substitutions.filter((_, idx) => idx !== index));
  };

  // Update specific substitution field
  const updateSubField = (index: number, field: keyof Omit<TeachingSubstitution, 'id' | 'signed'>, value: string) => {
    const updated = [...substitutions];
    updated[index] = { ...updated[index], [field]: value };
    setSubstitutions(updated);
  };

  // On form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-complete end date for non-leave items if omitted
    const finalDateEnd = (type === 'out_of_bounds' || type === 'attendance' || type === 'return_time') ? dateStart : dateEnd;

    onSubmitRequest({
      type,
      applicantName,
      applicantTel,
      applicantPosition,
      applicantGroup,
      reason,
      dateStart,
      dateEnd: finalDateEnd,
      timeStart: type === 'out_of_bounds' ? timeStart : '08:30',
      timeEnd: type === 'out_of_bounds' ? timeEnd : '16:30',
      contactAddress: (type === 'attendance' || type === 'return_time') ? `พยานบุคคล: ${witnessName}` : contactAddress,
      substitutions: substitutions.map((s, idx) => ({
        ...s,
        id: `sub-${Date.now()}-${idx}`,
        signed: false
      }))
    });

    // Reset fields
    setReason('');
    setDateStart('');
    setDateEnd('');
    setTimeStart('');
    setTimeEnd('');
    setContactAddress('');
    setWitnessName('');
    setSubstitutions([]);
    
    alert('ส่งคำร้องขอลากิจ/ลาป่วยสำเร็จ! ส่งแจ้งเตือนคำร้องไปยังผู้อนุมัติตามขั้นตอนแล้ว');
  };

  // Determine if substitution table is required
  const showSubstitution = type === 'sick' || type === 'personal' || type === 'out_of_bounds';

  return (
    <div id="leave-form-tab" className="bg-white p-6 rounded-2xl shadow-sm border border-brand-purple-light space-y-6">
      <div className="border-b border-purple-50 pb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
          <FileText className="w-5 h-5 text-brand-purple" />
          <span>ระบบยื่นคำร้องขอลา / ชี้แจงการมาปฏิบัติงาน</span>
        </h3>
        <p className="text-xs text-gray-500">กรอกข้อมูลและระบุการมอบหมายหน้าที่สอนแทนกรณีลาเรียนออกนอกโรงเรียน</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* [1] Basic Info Form (Auto-filled / Adjustable) */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
          <h4 className="font-semibold text-gray-700">1. ข้อมูลพื้นฐานของผู้ยื่นคำร้อง</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-600 font-semibold mb-1">ชื่อ - นามสกุล</label>
              <input
                type="text"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                required
                className="w-full bg-white border border-gray-200 rounded-lg p-2.5"
              />
            </div>
            <div>
              <label className="block text-gray-600 font-semibold mb-1">เบอร์โทรศัพท์ติดต่อ</label>
              <input
                type="text"
                value={applicantTel}
                onChange={(e) => setApplicantTel(e.target.value)}
                required
                className="w-full bg-white border border-gray-200 rounded-lg p-2.5"
              />
            </div>
            <div>
              <label className="block text-gray-600 font-semibold mb-1">ตำแหน่ง</label>
              <input
                type="text"
                value={applicantPosition}
                onChange={(e) => setApplicantPosition(e.target.value)}
                required
                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 bg-gray-50 text-gray-500 cursor-not-allowed"
                readOnly
              />
            </div>
            <div>
              <label className="block text-gray-600 font-semibold mb-1">กลุ่มสาระการเรียนรู้ / กลุ่มงาน</label>
              <input
                type="text"
                value={applicantGroup}
                onChange={(e) => setApplicantGroup(e.target.value)}
                required
                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 bg-gray-50 text-gray-500 cursor-not-allowed"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* [2] Form Type selection */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-700">2. รายละเอียดคำขอและเหตุผลความจำเป็น</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-600 font-semibold mb-1">ประเภทการลา / ขออนุญาต</label>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value as any);
                  // Clear subs if not applicable
                  if (e.target.value === 'attendance' || e.target.value === 'return_time') {
                    setSubstitutions([]);
                  }
                }}
                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 font-medium"
              >
                <option value="sick">ลาป่วย (Sick Leave)</option>
                <option value="personal">ลากิจส่วนตัว (Personal Leave)</option>
                <option value="maternity">ลาคลอดบุตร (Maternity Leave)</option>
                <option value="ordination">ลาอุปสมบท (Ordination Leave)</option>
                <option value="out_of_bounds">ขออนุญาตออกนอกบริเวณโรงเรียน</option>
                <option value="attendance">ชี้แจงเวลามาปฏิบัติงานสาย</option>
                <option value="return_time">ชี้แจงเวลากลับก่อนกำหนด</option>
              </select>
            </div>

            {/* Dynamic fields by Type */}
            {(type === 'sick' || type === 'personal' || type === 'maternity' || type === 'ordination') && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-gray-600 font-semibold mb-1">เนื่องจากเหตุผลความจำเป็น</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    placeholder="ระบุเหตุผล เช่น เป็นไข้หวัดปวดศีรษะ, ไปจัดการโอนที่ดิน, ฯลฯ"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">ตั้งแต่วันที่</label>
                  <input
                    type="date"
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                    required
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">ถึงวันที่</label>
                  <input
                    type="date"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    required
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-600 font-semibold mb-1">สถานที่ติดต่อขณะลา</label>
                  <input
                    type="text"
                    value={contactAddress}
                    onChange={(e) => setContactAddress(e.target.value)}
                    required
                    placeholder="บ้านเลขที่ หมู่ ซอย ถนน อ. เมือง จ. รหัสไปรษณีย์"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5"
                  />
                </div>
              </>
            )}

            {type === 'out_of_bounds' && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-gray-600 font-semibold mb-1">เนื่องจากภารกิจความจำเป็น</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    placeholder="ระบุความจำเป็น เช่น ไปธนาคารออมสิน, ไปรับบุตรที่รพ.พวงรักษ์"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">วันที่ขอออกนอกบริเวณ</label>
                  <input
                    type="date"
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                    required
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-gray-600 font-semibold mb-1">เวลาออกนอก</label>
                      <input
                        type="time"
                        value={timeStart}
                        onChange={(e) => setTimeStart(e.target.value)}
                        required
                        className="w-full bg-white border border-gray-200 rounded-lg p-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 font-semibold mb-1">เวลากลับเข้ามา</label>
                      <input
                        type="time"
                        value={timeEnd}
                        onChange={(e) => setTimeEnd(e.target.value)}
                        required
                        className="w-full bg-white border border-gray-200 rounded-lg p-2.5"
                      />
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-600 font-semibold mb-1">สถานที่ติดต่อ / ไปปฏิบัติภารกิจที่</label>
                  <input
                    type="text"
                    value={contactAddress}
                    onChange={(e) => setContactAddress(e.target.value)}
                    required
                    placeholder="ระบุสถานที่ปลายทางที่ออกนอกโรงเรียน"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5"
                  />
                </div>
              </>
            )}

            {(type === 'attendance' || type === 'return_time') && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-gray-600 font-semibold mb-1">เหตุผลความจำเป็นที่ชี้แจง</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    placeholder="ระบุสาเหตุ เช่น ยานพาหนะส่วนตัวชำรุดเสียหายกลางทาง, ติดทำธุระเร่งด่วนปฐมพยาบาลคนในบ้าน"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">วันที่ชี้แจง</label>
                  <input
                    type="date"
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                    required
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">ชื่อพยานบุคคลที่รับรองเหตุผล</label>
                  <input
                    type="text"
                    value={witnessName}
                    onChange={(e) => setWitnessName(e.target.value)}
                    required
                    placeholder="ระบุชื่อพยาน เช่น ครูใจดี ยิ้มหวาน"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* [3] Teaching Substitution Row Assignment Form (ONLY for sick, personal, out_of_bounds) */}
        {showSubstitution && (
          <div className="bg-purple-50/20 p-5 rounded-2xl border border-purple-100 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-purple-900 text-sm">3. รายการมอบหมายหน้าที่ปฏิบัติงานสอนแทน</h4>
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
                <span>ไม่มีตารางมอบหมายสอนแทน (กรณีไม่มีภาระคาบสอนตรงในช่วงเวลาดังกล่าว)</span>
              </div>
            ) : (
              <div className="space-y-3">
                {substitutions.map((sub, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm relative flex flex-col md:flex-row md:items-center gap-3">
                    {/* Trash Button */}
                    <button
                      type="button"
                      onClick={() => removeSubRow(idx)}
                      className="absolute right-3 top-3 text-red-400 hover:text-red-600 transition"
                      title="ลบแถว"
                    >
                      <Trash className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-2 md:grid-cols-7 gap-3 w-full pr-6 text-[11px]">
                      <div>
                        <label className="block text-gray-500 font-medium mb-0.5">ครูผู้สอน</label>
                        <input
                          type="text"
                          value={sub.teacherName}
                          disabled
                          className="w-full bg-slate-50 border border-slate-150 rounded p-1.5 font-semibold text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 font-medium mb-0.5">คาบที่สอน</label>
                        <select
                          value={sub.period}
                          onChange={(e) => updateSubField(idx, 'period', e.target.value)}
                          className="w-full border border-slate-200 rounded p-1.5 font-medium"
                        >
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
                        <select
                          value={sub.className}
                          onChange={(e) => updateSubField(idx, 'className', e.target.value)}
                          className="w-full border border-slate-200 rounded p-1.5 font-medium"
                        >
                          {classrooms.map((room, rIdx) => (
                            <option key={rIdx} value={room}>{room}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-500 font-medium mb-0.5">รหัสวิชา</label>
                        <input
                          type="text"
                          required
                          value={sub.courseCode}
                          onChange={(e) => updateSubField(idx, 'courseCode', e.target.value)}
                          placeholder="เช่น ว21101"
                          className="w-full border border-slate-200 rounded p-1.5"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 font-medium mb-0.5">ชื่อรายวิชา</label>
                        <input
                          type="text"
                          required
                          value={sub.courseName}
                          onChange={(e) => updateSubField(idx, 'courseName', e.target.value)}
                          placeholder="เช่น วิทยาศาสตร์ 1"
                          className="w-full border border-slate-200 rounded p-1.5"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 font-medium mb-0.5">ภาระงานที่มอบหมาย</label>
                        <input
                          type="text"
                          required
                          value={sub.assignedTask}
                          onChange={(e) => updateSubField(idx, 'assignedTask', e.target.value)}
                          placeholder="เช่น ทำแบบฝึกบทที่ 5"
                          className="w-full border border-slate-200 rounded p-1.5"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 font-medium mb-0.5">ผู้รับผิดชอบสอนแทน</label>
                        <select
                          value={sub.substituteTeacherName}
                          onChange={(e) => updateSubField(idx, 'substituteTeacherName', e.target.value)}
                          className="w-full border border-slate-200 rounded p-1.5 font-medium text-brand-purple"
                        >
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
        )}

        {/* [4] Submit controls */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
          <button
            type="reset"
            onClick={() => {
              setReason('');
              setWitnessName('');
              setContactAddress('');
              setSubstitutions([]);
            }}
            className="px-6 py-3 border border-slate-200 text-gray-600 rounded-xl font-bold hover:bg-slate-50 transition"
          >
            ล้างข้อมูลฟอร์ม
          </button>
          <button
            type="submit"
            className="bg-brand-purple hover:bg-brand-purple-dark text-white px-8 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition flex items-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>ยื่นใบคำร้องเข้าระบบ</span>
          </button>
        </div>
      </form>
    </div>
  );
}
