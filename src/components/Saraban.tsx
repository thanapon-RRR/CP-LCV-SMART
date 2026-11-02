import React, { useState } from 'react';
import { User, RequestItem, EdocOrder, CertificateRequest } from '../types';
import { FileText, ShieldAlert, FilePlus2, Receipt, Filter, Plus, ClipboardCheck, ArrowRight } from 'lucide-react';

interface SarabanProps {
  currentUser: User | null;
  requests: RequestItem[];
  edocs: EdocOrder[];
  certs: CertificateRequest[];
  onAddEdoc: (edoc: Omit<EdocOrder, 'id'>) => void;
  onAddCert: (cert: Omit<CertificateRequest, 'id'>) => void;
  onUpdateEdocStatus: (id: string, status: 'รอดำเนินการ' | 'เรียบร้อย') => void;
}

export default function Saraban({
  currentUser,
  requests,
  edocs,
  certs,
  onAddEdoc,
  onAddCert,
  onUpdateEdocStatus
}: SarabanProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Year filters
  const [acadYear, setAcadYear] = useState('2569');

  // New Edoc Form state
  const [selectedRequestForEdoc, setSelectedRequestForEdoc] = useState<RequestItem | null>(null);
  const [edocCommandNo, setEdocCommandNo] = useState('');
  const [edocTitle, setEdocTitle] = useState('');
  const [edocDept, setEdocDept] = useState('');

  // New Cert Form state
  const [certRequester, setCertRequester] = useState(currentUser?.name || '');
  const [certDate, setCertDate] = useState(new Date().toISOString().split('T')[0]);
  const [certTopic, setCertTopic] = useState('');
  const [certCount, setCertCount] = useState<number>(10);

  // Auto-unlock for Saraban administrators or personnel director or PIN "1234"
  React.useEffect(() => {
    if (currentUser && (currentUser.position.includes('งานสารบรรณ') || currentUser.position.includes('บุคลากร') || currentUser.position.includes('ผู้อำนวยการ'))) {
      setUnlocked(true);
    }
  }, [currentUser]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234' || (currentUser && (currentUser.position.includes('สารบรรณ') || currentUser.position.includes('บุคลากร') || currentUser.position.includes('ผู้อำนวยการ')))) {
      setUnlocked(true);
      setErrorMsg('');
    } else {
      setErrorMsg('PIN รหัสผ่านไม่ถูกต้อง หรือคุณไม่มีสิทธิ์เข้าถึงงานสารบรรณและออกเลขคำสั่ง');
    }
  };

  // 100% Approved travel requests that don't have an Edoc yet
  const eligibleRequests = requests.filter(r => {
    return r.status === 'approved' && r.type === 'travel' && !edocs.some(e => e.requestId === r.id);
  });

  // Calculate certificate start number: previous cert request startNo + certCount
  const calculatedStartNo = React.useMemo(() => {
    if (certs.length === 0) return 1001; // Starting seed if empty
    // Sort certs by startNo descending
    const sorted = [...certs].sort((a, b) => b.startNo - a.startNo);
    const last = sorted[0];
    return last.startNo + last.certCount;
  }, [certs]);

  const handleCreateEdoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForEdoc) {
      alert('โปรดเลือกใบคำร้องไปราชการที่ผ่านการอนุมัติ');
      return;
    }

    const companionsList = selectedRequestForEdoc.companions || [];
    const travelNames = [selectedRequestForEdoc.applicantName, ...companionsList];

    onAddEdoc({
      requestId: selectedRequestForEdoc.id,
      commandNo: edocCommandNo,
      title: edocTitle || `คำสั่งอนุมัติเดินทางไปราชการเรื่อง ${selectedRequestForEdoc.reason}`,
      travelNames,
      dateStr: selectedRequestForEdoc.dateStart,
      location: selectedRequestForEdoc.contactAddress,
      groupNotes: edocDept || selectedRequestForEdoc.applicantGroup,
      status: 'เรียบร้อย'
    });

    // Reset Form
    setSelectedRequestForEdoc(null);
    setEdocCommandNo('');
    setEdocTitle('');
    setEdocDept('');

    alert('ออกเลขและร่างคำสั่งราชการเรียบร้อยแล้ว บันทึกประวัติเสร็จสมบูรณ์!');
  };

  const handleCreateCert = (e: React.FormEvent) => {
    e.preventDefault();
    onAddCert({
      applicantName: certRequester,
      requestDate: certDate,
      topic: certTopic,
      certCount: certCount,
      startNo: calculatedStartNo
    });

    // Reset Form
    setCertTopic('');
    setCertCount(10);

    alert('จองรหัสเลขที่เกียรติบัตรสำเร็จ! เลขเริ่มต้นวิเคราะห์ตามประวัติแล้ว');
  };

  if (!unlocked) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-brand-purple-light max-w-md mx-auto text-center space-y-6">
        <div className="mx-auto w-12 h-12 bg-purple-50 text-brand-purple rounded-full flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-800">ยืนยันสิทธิ์เข้าถึงส่วนงานสารบรรณโรงเรียน</h3>
          <p className="text-xs text-gray-400 mt-1">ส่วนออกคำสั่งเดินทางไปราชการของเจ้าหน้าที่ธุรการ และจัดสรรเลขเกียรติบัตรบุคลากร</p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="กรอกรหัส PIN ผู้พิจารณา"
              className="w-full text-center bg-slate-50 border border-slate-200 rounded-xl p-3 text-lg font-bold tracking-widest focus:outline-none focus:ring-1 focus:ring-brand-purple"
            />
          </div>
          {errorMsg && <p className="text-[11px] text-red-500 font-semibold">{errorMsg}</p>}
          <button
            type="submit"
            className="w-full bg-brand-purple hover:bg-brand-purple-dark text-white p-3 rounded-xl font-bold text-xs transition shadow-sm"
          >
            เข้าสู่ระบบงานสารบรรณ
          </button>
        </form>
      </div>
    );
  }

  return (
    <div id="saraban-tab" className="space-y-6">
      {/* Search and settings bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-brand-purple-light flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">ระบบงานสารบรรณโรงเรียนชุมพวงศึกษา (Saraban & Edoc Hub)</h3>
          <p className="text-xs text-gray-500">สำหรับเจ้าหน้าที่ธุรการออกคำสั่งราชการจากคำร้องอนุมัติ 100% และคุมบัญชีเลขเกียรติบัตรของโรงเรียน</p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-gray-500">ปีงบประมาณ/การศึกษา:</span>
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
        {/* Left Side: Travel orders compiler */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-purple-light space-y-4">
            <h4 className="font-bold text-sm text-gray-700 flex items-center space-x-1.5 border-b border-gray-100 pb-2">
              <FilePlus2 className="w-5 h-5 text-brand-purple" />
              <span>ออกเลขคำสั่งไปราชการ (Official Orders Generator)</span>
            </h4>

            {eligibleRequests.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs">ขณะนี้ไม่มีคำร้องเดินทางไปราชการที่อนุมัติครบร้อยละ 100 ที่ยังไม่ออกเลขคำสั่ง</div>
            ) : (
              <form onSubmit={handleCreateEdoc} className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">เลือกใบคำร้องไปราชการที่อนุมัติสำเร็จ</label>
                  <select
                    value={selectedRequestForEdoc?.id || ''}
                    onChange={(e) => {
                      const reqObj = eligibleRequests.find(r => r.id === e.target.value);
                      if (reqObj) {
                        setSelectedRequestForEdoc(reqObj);
                        setEdocTitle(`แต่งตั้งบุคลากรโรงเรียนเดินทางไปราชการเพื่อ ${reqObj.reason}`);
                        setEdocDept(reqObj.applicantGroup);
                      } else {
                        setSelectedRequestForEdoc(null);
                      }
                    }}
                    required
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 font-medium text-gray-800"
                  >
                    <option value="">--เลือกใบคำร้องอนุมัติ 100%--</option>
                    {eligibleRequests.map((r, rIdx) => (
                      <option key={rIdx} value={r.id}>
                        {r.applicantName} | {r.reason} ({r.dateStart})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedRequestForEdoc && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-gray-600 font-semibold mb-1">เลขที่คำสั่งแต่งตั้ง (ศธ)</label>
                        <input
                          type="text"
                          required
                          value={edocCommandNo}
                          onChange={(e) => setEdocCommandNo(e.target.value)}
                          placeholder="เช่น ศธ 04225.102/ว099"
                          className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 font-semibold mb-1">หน่วยงานเจ้าของเรื่อง / กลุ่มงาน</label>
                        <input
                          type="text"
                          required
                          value={edocDept}
                          onChange={(e) => setEdocDept(e.target.value)}
                          className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-600 font-semibold mb-1">ชื่อเรื่อง/หัวข้อคำสั่งแต่งตั้งอย่างเป็นทางการ</label>
                      <input
                        type="text"
                        required
                        value={edocTitle}
                        onChange={(e) => setEdocTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2"
                      />
                    </div>

                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 space-y-1">
                      <span className="block text-[10px] font-bold text-brand-purple">บุคลากรที่มีชื่อในคำสั่งแต่งตั้งเดินทาง:</span>
                      <p className="font-semibold text-gray-700">
                        {selectedRequestForEdoc.applicantName}
                        {selectedRequestForEdoc.companions && selectedRequestForEdoc.companions.map((c, i) => `, ${c}`)}
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-brand-purple hover:bg-brand-purple-dark text-white p-2.5 rounded-lg font-bold text-xs"
                    >
                      ออกคำสั่งราชการเรียบร้อย (Sync to Saraban)
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* History of Edoc table */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-purple-light space-y-3">
            <h4 className="font-bold text-sm text-gray-700">ทะเบียนออกคำสั่งเดินทางไปราชการล่าสุด</h4>
            <div className="overflow-x-auto border border-gray-100 rounded-xl max-h-60 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-gray-500 border-b border-gray-100 sticky top-0">
                  <tr>
                    <th className="p-3">เลขที่คำสั่ง</th>
                    <th className="p-3">ชื่อวิชา/คำสั่งแต่งตั้ง</th>
                    <th className="p-3">รายชื่อคณะผู้เดินทาง</th>
                    <th className="p-3">หน่วยงาน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {edocs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-gray-400">ยังไม่มีประวัติออกเลขคำสั่งราชการ</td>
                    </tr>
                  ) : (
                    edocs.map((e, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-brand-purple">{e.commandNo}</td>
                        <td className="p-3">
                          <span className="font-semibold text-gray-800">{e.title}</span>
                          <span className="block text-[10px] text-gray-400">สถานที่: {e.location} ({e.dateStr})</span>
                        </td>
                        <td className="p-3 font-medium text-gray-600">
                          {e.travelNames?.join(', ')}
                        </td>
                        <td className="p-3 text-gray-400">{e.groupNotes}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Certificate request list and generator */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-purple-light space-y-4">
            <h4 className="font-bold text-sm text-gray-700 flex items-center space-x-1.5 border-b border-gray-100 pb-2">
              <Receipt className="w-5 h-5 text-brand-blue" />
              <span>ขออนุมัติจัดสรรเลขเกียรติบัตร (Certificate Code Booking)</span>
            </h4>

            <form onSubmit={handleCreateCert} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">ผู้ขอจองรหัสเลข</label>
                  <input
                    type="text"
                    required
                    value={certRequester}
                    onChange={(e) => setCertRequester(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2.5 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">วันที่ต้องการรหัส</label>
                  <input
                    type="date"
                    required
                    value={certDate}
                    onChange={(e) => setCertDate(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">หัวข้อ/โครงการจัดสรรเกียรติบัตร</label>
                <input
                  type="text"
                  required
                  value={certTopic}
                  onChange={(e) => setCertTopic(e.target.value)}
                  placeholder="ระบุชื่อวิชา โครงการ หรือเกียรติคุณ เช่น โครงการอบรมค่ายคณิตคิดเลขเร็ว ม.ต้น"
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">จำนวนเกียรติบัตรที่จัดทำ (ใบ)</label>
                  <input
                    type="number"
                    required
                    value={certCount}
                    onChange={(e) => setCertCount(parseInt(e.target.value) || 0)}
                    min={1}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2.5"
                  />
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="block text-[9px] text-gray-400 font-bold uppercase">วิเคราะห์รหัสเลขเริ่มต้น</span>
                  <span className="block font-bold text-gray-700 mt-1">เลขเริ่มต้น: รพ.ศ.{calculatedStartNo}</span>
                  <span className="text-[10px] text-gray-400 block">ถึง รพ.ศ.{calculatedStartNo + certCount - 1}</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white p-2.5 rounded-lg font-bold text-xs"
              >
                บันทึกจัดสรรเลขเกียรติบัตร (Book Certificate Numbers)
              </button>
            </form>
          </div>

          {/* Certificate listing table */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-purple-light space-y-3">
            <h4 className="font-bold text-sm text-gray-700">ทะเบียนควบคุมและจองเลขที่เกียรติบัตรโรงเรียน</h4>
            <div className="overflow-x-auto border border-gray-100 rounded-xl max-h-60 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-gray-500 border-b border-gray-100 sticky top-0">
                  <tr>
                    <th className="p-3">วันที่จอง</th>
                    <th className="p-3">ผู้ยื่นคำขอ</th>
                    <th className="p-3">ชื่อเรื่อง/หัวข้อกิจกรรม</th>
                    <th className="p-3 text-center">รหัสเลขที่จัดสรร</th>
                    <th className="p-3 text-center">จำนวนใบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {certs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-gray-400">ยังไม่มีประวัติจองเลขเกียรติบัตร</td>
                    </tr>
                  ) : (
                    certs.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 text-gray-500">{c.requestDate}</td>
                        <td className="p-3 font-semibold text-gray-800">{c.applicantName}</td>
                        <td className="p-3 font-medium text-gray-600">{c.topic}</td>
                        <td className="p-3 text-center font-bold text-brand-blue">
                          รพ.ศ.{c.startNo} - {c.startNo + c.certCount - 1}
                        </td>
                        <td className="p-3 text-center font-bold text-gray-500">{c.certCount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
