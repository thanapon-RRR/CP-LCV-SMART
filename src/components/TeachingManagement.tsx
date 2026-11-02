import React, { useState } from 'react';
import { User, RequestItem, TeachingSubstitution } from '../types';
import { BookOpen, Printer, CheckCircle2, Plus, Calendar, Filter } from 'lucide-react';

interface TeachingManagementProps {
  currentUser: User | null;
  users: User[];
  requests: RequestItem[];
  onSignSubstitution: (requestId: string, subId: string) => void;
  onAddManualSubstitution: (requestId: string, substitution: TeachingSubstitution) => void;
}

export default function TeachingManagement({
  currentUser,
  users,
  requests,
  onSignSubstitution,
  onAddManualSubstitution
}: TeachingManagementProps) {
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [acadYear, setAcadYear] = useState('2569');
  const [showAddManualModal, setShowAddManualModal] = useState(false);

  // Manual sub form states
  const [subTeacherName, setSubTeacherName] = useState(currentUser?.name || '');
  const [subPeriod, setSubPeriod] = useState('คาบที่ 1 (08:30-09:30)');
  const [subCourseCode, setSubCourseCode] = useState('');
  const [subCourseName, setSubCourseName] = useState('');
  const [subClassName, setSubClassName] = useState('ม.1/1');
  const [subTask, setSubTask] = useState('');
  const [subReplacementName, setSubReplacementName] = useState('');

  // Classrooms ม.1/1 - ม.6/10
  const classrooms: string[] = [];
  for (let grade = 1; grade <= 6; grade++) {
    for (let room = 1; room <= 10; room++) {
      classrooms.push(`ม.${grade}/${room}`);
    }
  }

  // Retrieve all substitutions across all requests for the filtered date
  const dailySubstitutions = React.useMemo(() => {
    const list: Array<{
      requestId: string;
      applicantName: string;
      date: string;
      sub: TeachingSubstitution;
    }> = [];

    requests.forEach(r => {
      // Show substitution for this date (either request starts on filterDate, or covers filterDate)
      const isWithinDate = new Date(r.dateStart) <= new Date(filterDate) && new Date(r.dateEnd) >= new Date(filterDate);
      if (isWithinDate && r.status === 'approved') {
        (r.substitutions || []).forEach(sub => {
          list.push({
            requestId: r.id,
            applicantName: r.applicantName,
            date: filterDate,
            sub
          });
        });
      }
    });

    return list;
  }, [requests, filterDate]);

  const handlePrint = () => {
    window.print();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subReplacementName) {
      alert('โปรดเลือกครูผู้รับผิดชอบสอนแทน');
      return;
    }

    const newSub: TeachingSubstitution = {
      id: `manual-sub-${Date.now()}`,
      teacherName: subTeacherName,
      period: subPeriod,
      courseCode: subCourseCode,
      courseName: subCourseName,
      className: subClassName,
      assignedTask: subTask,
      substituteTeacherName: subReplacementName,
      signed: false
    };

    // We append this substitution to an existing request or we can create a mock parent request
    // Here we find any approved request of this teacher or default to the first request
    const candidateRequest = requests.find(r => r.applicantName === subTeacherName) || requests[0];
    if (candidateRequest) {
      onAddManualSubstitution(candidateRequest.id, newSub);
      setShowAddManualModal(false);
      // Reset form
      setSubCourseCode('');
      setSubCourseName('');
      setSubTask('');
      alert('บันทึกเพิ่มตารางสอนแทนแบบแมนนวลเรียบร้อย!');
    } else {
      alert('ไม่พบข้อมูลการลาของครูผู้นี้ในฐานข้อมูล ไม่สามารถผูกภาระการสอนแทนได้');
    }
  };

  return (
    <div id="teaching-management-tab" className="space-y-6">
      {/* Search Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-brand-purple-light flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">ระบบบริหารจัดการคาบสอน & งานสอนแทน</h3>
          <p className="text-xs text-gray-500">ตรวจสอบภาระคาบสอนแทนรายวัน, จัดพิมพ์สรุปภาระงานประจำวัน, และลงบันทึกการเซ็นชื่อปฏิบัติงานแทน</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={acadYear}
              onChange={(e) => setAcadYear(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
            >
              <option value="2569">2569</option>
              <option value="2568">2568</option>
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-gray-700 px-3.5 py-2 rounded-xl font-semibold transition"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์รายงาน (PDF)</span>
          </button>

          <button
            onClick={() => setShowAddManualModal(true)}
            className="flex items-center space-x-1 bg-brand-purple text-white px-3.5 py-2 rounded-xl font-bold hover:bg-brand-purple-dark transition"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มคำสั่งสอนแทนพิเศษ</span>
          </button>
        </div>
      </div>

      {/* Main Table view of substitution workload */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-purple-light space-y-4 print:border-none print:shadow-none">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <h4 className="font-bold text-sm text-gray-700 flex items-center space-x-1.5">
            <BookOpen className="w-5 h-5 text-brand-purple" />
            <span>ตารางภาระงานปฏิบัติการสอนแทนประจำวันที่: {filterDate}</span>
          </h4>
          <span className="text-xs text-gray-400 font-semibold print:hidden">ปีการศึกษา: {acadYear}</span>
        </div>

        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-gray-500 border-b border-gray-100">
                <th className="p-3">ครูเจ้าของตาราง</th>
                <th className="p-3">คาบที่สอน</th>
                <th className="p-3">ระดับชั้น</th>
                <th className="p-3">วิชา / รหัสวิชา</th>
                <th className="p-3">งานที่มอบหมาย</th>
                <th className="p-3 text-brand-purple">ครูผู้สอนแทน</th>
                <th className="p-3 text-center">การเซ็นชื่อปฏิบัติงานแทน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {dailySubstitutions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">ไม่มีตารางภาระการสอนแทนในวันที่ระบุ</td>
                </tr>
              ) : (
                dailySubstitutions.map(({ requestId, applicantName, sub }, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-gray-800">{applicantName}</td>
                    <td className="p-3 text-gray-600 font-medium">{sub.period}</td>
                    <td className="p-3 text-gray-700 font-semibold">{sub.className}</td>
                    <td className="p-3">
                      <span className="font-semibold text-gray-800">{sub.courseCode}</span>
                      <span className="block text-[10px] text-gray-400">{sub.courseName}</span>
                    </td>
                    <td className="p-3 text-gray-500 max-w-xs truncate">{sub.assignedTask}</td>
                    <td className="p-3 font-bold text-purple-700">{sub.substituteTeacherName}</td>
                    <td className="p-3 text-center">
                      {sub.signed ? (
                        <span className="inline-flex items-center space-x-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-green-100">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ยืนยันเซ็นชื่อแล้ว</span>
                        </span>
                      ) : (
                        currentUser?.name === sub.substituteTeacherName ? (
                          <button
                            onClick={() => onSignSubstitution(requestId, sub.id)}
                            className="bg-brand-purple hover:bg-brand-purple-dark text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition shadow-sm"
                          >
                            ✓ กดเซ็นชื่อดิจิทัลแทน
                          </button>
                        ) : (
                          <span className="bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-1 rounded-full text-[10px] font-medium">
                            รอเซ็นชื่อปฏิบัติงาน
                          </span>
                        )
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Substitution Addition Modal */}
      {showAddManualModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl relative border border-brand-purple-light text-xs space-y-4">
            <h3 className="text-base font-bold text-gray-800">ลงตารางบันทึกการสอนแทนแบบแมนนวล</h3>
            <p className="text-[10px] text-gray-400">กรณีออกคำสั่งเร่งด่วนเพิ่มเติมภายนอกระบบใบลาปกติ</p>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="block text-gray-600 font-semibold mb-0.5">ครูเจ้าของตารางสอน</label>
                <select
                  value={subTeacherName}
                  onChange={(e) => setSubTeacherName(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2"
                >
                  {users.map((u, uIdx) => (
                    <option key={uIdx} value={u.name}>{u.name} ({u.position})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-0.5">คาบที่สอนแทน</label>
                  <select
                    value={subPeriod}
                    onChange={(e) => setSubPeriod(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2"
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
                  <label className="block text-gray-600 font-semibold mb-0.5">ระดับชั้นเรียน</label>
                  <select
                    value={subClassName}
                    onChange={(e) => setSubClassName(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2"
                  >
                    {classrooms.map((room, rIdx) => (
                      <option key={rIdx} value={room}>{room}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-0.5">รหัสวิชา</label>
                  <input
                    type="text"
                    required
                    value={subCourseCode}
                    onChange={(e) => setSubCourseCode(e.target.value)}
                    placeholder="เช่น ค21101"
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-0.5">ชื่อวิชา</label>
                  <input
                    type="text"
                    required
                    value={subCourseName}
                    onChange={(e) => setSubCourseName(e.target.value)}
                    placeholder="เช่น คณิตศาสตร์ 1"
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-0.5">ภาระงานที่มอบหมาย</label>
                <input
                  type="text"
                  required
                  value={subTask}
                  onChange={(e) => setSubTask(e.target.value)}
                  placeholder="ระบุคำสั่งการเรียนรู้ เช่น ทำใบงานอัตราส่วน"
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-0.5">ครูผู้สอนแทนในสังกัด</label>
                <select
                  value={subReplacementName}
                  onChange={(e) => setSubReplacementName(e.target.value)}
                  className="w-full bg-slate-50 border border-purple-200 rounded-lg p-2 font-semibold text-brand-purple"
                >
                  <option value="">--เลือกรายชื่อครูสอนแทน--</option>
                  {users.filter(u => u.name !== subTeacherName).map((u, uIdx) => (
                    <option key={uIdx} value={u.name}>{u.name} ({u.group})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddManualModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg font-semibold text-gray-600"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="bg-brand-purple hover:bg-brand-purple-dark text-white px-5 py-2 rounded-lg font-bold"
                >
                  บันทึกตารางสอนแทน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
