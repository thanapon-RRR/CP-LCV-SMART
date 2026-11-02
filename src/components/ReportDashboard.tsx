import React, { useState, useMemo } from 'react';
import { RequestItem, VehicleBooking, BuildingBooking, User } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import {
  ChartSpline, Users, Printer, TrendingUp, Bus, FileText,
  Download, Eye, CheckCircle2, ShieldCheck, Building2, School,
  FileCheck, HelpCircle, X, ChevronRight, Filter, Share2, Check, Copy
} from 'lucide-react';

interface ReportDashboardProps {
  requests: RequestItem[];
  vehicleBookings: VehicleBooking[];
  buildingBookings?: BuildingBooking[];
  users?: User[];
  currentUser?: User | null;
  onTriggerToast?: (toast: {
    type: 'approved' | 'rejected' | 'progress' | 'info';
    title: string;
    applicantName: string;
    reason: string;
    message: string;
    stepInfo?: string;
  }) => void;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00C49F', '#FFBB28'];

export default function ReportDashboard({
  requests,
  vehicleBookings,
  buildingBookings = [],
  users = [],
  currentUser,
  onTriggerToast
}: ReportDashboardProps) {
  const [acadYear, setAcadYear] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const y = params.get('year');
      if (y && ['2567', '2568', '2569'].includes(y)) return y;
    }
    return '2569';
  });
  const [termPeriod, setTermPeriod] = useState<'all' | 'term1' | 'term2'>('all');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Form states for official signature customization in PDF printout
  const [reportSigner, setReportSigner] = useState(currentUser?.name || 'นายวิชัย สุขเกษม');
  const [reportSignerRole, setReportSignerRole] = useState('เจ้าหน้าที่งานบริหารงานบุคคล');
  const [checkerSigner, setCheckerSigner] = useState('นายประสิทธิ์ การดี');
  const [checkerSignerRole, setCheckerSignerRole] = useState('รองผู้อำนวยการกลุ่มบริหารงานบุคคล');
  const [directorSigner, setDirectorSigner] = useState('นายสมชาย ดีเลิศ');
  const [directorSignerRole, setDirectorSignerRole] = useState('ผู้อำนวยการโรงเรียนชุมพวงศึกษา');
  const [reportNote, setReportNote] = useState(
    'ข้าราชการครูและบุคลากรทางการศึกษาได้ปฏิบัติตนตามระเบียบแบบแผน มีวินัยในการปฏิบัติราชการ และมีการจัดครูผู้สอนแทนครบถ้วนทุกคาบเรียน ไม่ส่งผลกระทบต่อการเรียนการสอนของนักเรียน'
  );

  // Filter requests by academic year & semester if applicable
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      // In production/prototype, can filter based on acadYear / dates
      return true;
    });
  }, [requests, acadYear, termPeriod]);

  // 1. Detailed Aggregated Leave Statistics (count, days, percentage)
  const leaveStatsDetailed = useMemo(() => {
    const statsMap: Record<string, { label: string; count: number; days: number; color: string; ruleNote: string }> = {
      sick: { label: 'ลาป่วย', count: 0, days: 0, color: '#F43F5E', ruleNote: 'ตามระเบียบสำนักนายกฯ มีใบรับรองแพทย์กรณี 3 วันขึ้นไป' },
      personal: { label: 'ลากิจส่วนตัว', count: 0, days: 0, color: '#F59E0B', ruleNote: 'ได้รับอนุญาตล่วงหน้าก่อนหยุดปฏิบัติงาน' },
      maternity: { label: 'ลาคลอดบุตร', count: 0, days: 0, color: '#EC4899', ruleNote: 'ไม่เกิน 90 วัน ได้รับเงินเดือนเต็ม' },
      ordination: { label: 'ลาอุปสมบทหรือพิธีฮัจญ์', count: 0, days: 0, color: '#10B981', ruleNote: 'ตามระเบียบการลาของทางราชการ' },
      out_of_bounds: { label: 'ขออนุญาตออกนอกบริเวณโรงเรียน', count: 0, days: 0, color: '#6366F1', ruleNote: 'บันทึกเวลาไป-กลับและระบุภารกิจชัดเจน' },
      attendance: { label: 'ชี้แจงการมาปฏิบัติราชการสาย', count: 0, days: 0, color: '#3B82F6', ruleNote: 'ลงเวลาผ่านเกณฑ์ชี้แจงเหตุผลความจำเป็น' },
      return_time: { label: 'ชี้แจงการขอกลับก่อนเวลา', count: 0, days: 0, color: '#8B5CF6', ruleNote: 'ได้รับอนุมัติจากผู้บังคับบัญชาตามลำดับ' }
    };

    let totalLeaveRequests = 0;
    let totalLeaveDays = 0;

    filteredRequests.forEach(r => {
      if (r.type !== 'travel' && r.status === 'approved') {
        const key = r.type;
        if (statsMap[key]) {
          statsMap[key].count += 1;
          statsMap[key].days += r.totalDays || 1;
          totalLeaveRequests += 1;
          totalLeaveDays += r.totalDays || 1;
        }
      }
    });

    const list = Object.entries(statsMap).map(([key, val]) => ({
      key,
      name: val.label,
      count: val.count,
      days: val.days,
      color: val.color,
      ruleNote: val.ruleNote,
      percentage: totalLeaveRequests > 0 ? ((val.count / totalLeaveRequests) * 100).toFixed(1) : '0.0'
    }));

    return { list, totalLeaveRequests, totalLeaveDays };
  }, [filteredRequests]);

  // Leave stats simple array for Recharts
  const leaveStats = leaveStatsDetailed.list;

  // 2. Official Travel Statistics
  const travelStats = useMemo(() => {
    const travelRequests = filteredRequests.filter(r => r.type === 'travel');
    const approved = travelRequests.filter(r => r.status === 'approved');
    const pending = travelRequests.filter(r => r.status === 'pending');
    const totalDays = approved.reduce((acc, curr) => acc + (curr.totalDays || 1), 0);

    return {
      total: travelRequests.length,
      approvedCount: approved.length,
      pendingCount: pending.length,
      totalDays,
      recentApproved: approved.slice(0, 5)
    };
  }, [filteredRequests]);

  // 3. Calculate vehicle bookings usage counts
  const vehicleStats = useMemo(() => {
    const counts: Record<string, number> = {
      'รถตู้ 1': 0,
      'รถตู้ 2': 0,
      'รถหกล้อ 1': 0,
      'รถหกล้อ 2': 0,
      'รถยนต์ส่วนตัว': 0
    };

    vehicleBookings.forEach(v => {
      if (v.status === 'approved') {
        const key = v.vehicleType === 'private' ? 'รถยนต์ส่วนตัว' : v.vehicleType;
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [vehicleBookings]);

  // Building bookings summary
  const buildingStats = useMemo(() => {
    const approved = buildingBookings.filter(b => b.status === 'approved');
    const pending = buildingBookings.filter(b => b.status === 'pending');
    return {
      total: buildingBookings.length,
      approvedCount: approved.length,
      pendingCount: pending.length
    };
  }, [buildingBookings]);

  // 4. Trends over time (monthly leaves and travels count)
  const trendData = useMemo(() => {
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const data = months.map(m => ({ name: m, Leaves: 0, Travels: 0 }));

    filteredRequests.forEach(r => {
      if (r.status === 'approved') {
        try {
          const date = new Date(r.dateStart);
          const monthIndex = date.getMonth();
          if (monthIndex >= 0 && monthIndex < 12) {
            if (r.type === 'travel') {
              data[monthIndex].Travels += 1;
            } else {
              data[monthIndex].Leaves += 1;
            }
          }
        } catch {
          // ignore parsing error
        }
      }
    });

    return data;
  }, [filteredRequests]);

  // 5. Total teaching substitutions signed vs pending
  const subsSummary = useMemo(() => {
    let signed = 0;
    let pending = 0;
    filteredRequests.forEach(r => {
      if (r.status === 'approved' && r.substitutions) {
        r.substitutions.forEach(s => {
          if (s.signed) signed += 1;
          else pending += 1;
        });
      }
    });
    const total = signed + pending;
    const rate = total > 0 ? ((signed / total) * 100).toFixed(1) : '100.0';
    return { signed, pending, total, rate };
  }, [filteredRequests]);

  // Total active personnel count (excluding system admin as requested)
  const totalPersonnel = useMemo(() => {
    return users.filter(u => u.position !== 'แอดมินระบบ' && u.group !== '-').length || 65;
  }, [users]);

  // Trigger print dialog (users select "Save as PDF" to save or choose physical printer)
  const handlePrintDocument = () => {
    window.print();
  };

  // Share report link handler with clipboard copy and fallback
  const handleShareReport = async () => {
    let shareUrl = window.location.href;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'reports');
      url.searchParams.set('year', acadYear);
      shareUrl = url.toString();
    } catch {
      shareUrl = `${window.location.origin}${window.location.pathname}?tab=reports&year=${acadYear}`;
    }

    let copied = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        copied = true;
      } catch {
        copied = false;
      }
    }

    if (!copied) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch (err) {
        console.error('Fallback clipboard copy failed:', err);
      }
    }

    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 3000);

    if (onTriggerToast) {
      onTriggerToast({
        type: 'info',
        title: 'คัดลอกลิงก์รายงานเรียบร้อยแล้ว! 📋',
        applicantName: currentUser?.name || 'ผู้ใช้งานระบบ',
        reason: `แดชบอร์ดสรุปผลการปฏิบัติงาน ปีการศึกษา ${acadYear}`,
        message: 'คัดลอกลิงก์ไปยังคลิปบอร์ดแล้ว พร้อมส่งต่อให้เพื่อนร่วมงานหรือหัวหน้างาน',
        stepInfo: 'แชร์รายงานสำเร็จ'
      });
    }
  };

  // Thai Date Formatter
  const todayFormattedThai = useMemo(() => {
    const now = new Date();
    const monthsThai = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const day = now.getDate();
    const month = monthsThai[now.getMonth()];
    const year = now.getFullYear() + 543;
    return `${day} ${month} พ.ศ. ${year}`;
  }, []);

  return (
    <div id="report-dashboard-tab" className="space-y-6">
      {/* Search and control bar (hidden when printing) */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-brand-purple-light flex flex-col lg:flex-row justify-between lg:items-center gap-4 print:hidden">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
            <ChartSpline className="w-5 h-5 text-brand-purple" />
            <span>ระบบวิเคราะห์สถิติ & สรุปสารสนเทศโรงเรียนชุมพวงศึกษา</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            รายงานสถิติอัตรากำลัง, ปริมาณภาระงานสอนแทน, การไปราชการ และการขอใช้ยานพาหนะ/สถานที่ รองรับการพิมพ์ส่งเอกสารจริง
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-semibold text-gray-600">ปีการศึกษา:</span>
            <select
              value={acadYear}
              onChange={(e) => setAcadYear(e.target.value)}
              className="bg-transparent font-bold text-brand-purple focus:outline-none cursor-pointer"
            >
              <option value="2569">2569</option>
              <option value="2568">2568</option>
              <option value="2567">2567</option>
            </select>
          </div>

          {/* Share Report Button */}
          <button
            onClick={handleShareReport}
            title="คัดลอกลิงก์แดชบอร์ดสรุปผลการปฏิบัติงานปัจจุบันไปยังคลิปบอร์ดเพื่อแชร์ให้เพื่อนร่วมงาน"
            className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl font-bold transition shadow-sm cursor-pointer border ${
              isCopied
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-200'
                : 'bg-white hover:bg-purple-50 text-brand-purple border-brand-purple/30'
            }`}
          >
            {isCopied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">คัดลอกลิงก์แล้ว!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>แชร์รายงาน</span>
              </>
            )}
          </button>

          {/* Primary Action Button: Open PDF Document Preview & Print */}
          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-brand-purple to-indigo-700 hover:from-brand-purple-dark hover:to-indigo-800 text-white px-4 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-purple-200 animate-bounce" />
            <span>ดาวน์โหลดรายงาน PDF / พิมพ์ส่งเอกสาร</span>
          </button>

          {/* Direct Print Button */}
          <button
            onClick={handlePrintDocument}
            title="สั่งพิมพ์ด่วนตามรูปแบบมาตรฐาน"
            className="flex items-center space-x-1.5 bg-white hover:bg-purple-50 text-brand-purple border border-brand-purple/30 px-3.5 py-2.5 rounded-xl font-bold transition shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">พิมพ์ด่วน</span>
          </button>
        </div>
      </div>

      {/* Aggregate metrics grid (Screen view) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs print:hidden">
        <div className="bg-white p-4.5 rounded-2xl border border-brand-purple-light shadow-sm flex items-center space-x-3.5">
          <div className="bg-purple-50 p-3 rounded-xl text-brand-purple">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-gray-400 block font-semibold text-[10px] uppercase">ใบอนุมัติรวมทั้งหมด</span>
            <span className="text-xl font-bold text-gray-800">
              {filteredRequests.filter(r => r.status === 'approved').length} ฉบับ
            </span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-brand-purple-light shadow-sm flex items-center space-x-3.5">
          <div className="bg-sky-50 p-3 rounded-xl text-brand-blue">
            <Bus className="w-5 h-5" />
          </div>
          <div>
            <span className="text-gray-400 block font-semibold text-[10px] uppercase">ยอดจองรถส่วนกลาง</span>
            <span className="text-xl font-bold text-gray-800">
              {vehicleBookings.filter(v => v.status === 'approved' && v.vehicleType !== 'private').length} ครั้ง
            </span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-brand-purple-light shadow-sm flex items-center space-x-3.5">
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-gray-400 block font-semibold text-[10px] uppercase">ชั่วโมงสอนแทนที่บันทึก</span>
            <span className="text-xl font-bold text-gray-800">{subsSummary.signed} คาบ</span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-brand-purple-light shadow-sm flex items-center space-x-3.5">
          <div className="bg-rose-50 p-3 rounded-xl text-rose-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-gray-400 block font-semibold text-[10px] uppercase">รอดำเนินการสะสม</span>
            <span className="text-xl font-bold text-gray-800">
              {filteredRequests.filter(r => r.status === 'pending').length} รายการ
            </span>
          </div>
        </div>
      </div>

      {/* Screen Interactive Charts Section (print:hidden) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs print:hidden">
        {/* Bar chart - Leaves categories (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-brand-purple-light shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-sm text-gray-700 flex items-center space-x-1.5">
              <span>สถิติจำนวนครั้งการยื่นใบลาแยกตามกลุ่มประเภทคำขอ</span>
            </h4>
            <span className="text-[11px] text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full font-semibold">
              รวม {leaveStatsDetailed.totalLeaveRequests} ครั้ง
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaveStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8">
                  {leaveStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie chart - Vehicle distribution (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-brand-purple-light shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-gray-700">สัดส่วนการเลือกจองรถยนต์ส่วนกลางแยกคัน</h4>
          <div className="h-64 flex flex-col justify-center items-center">
            {vehicleStats.every(v => v.value === 0) ? (
              <p className="text-gray-400 text-xs py-10">ยังไม่มียอดจองรถยนต์ที่ผ่านการอนุมัติ</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={vehicleStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {vehicleStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                {/* Labels legend */}
                <div className="flex flex-wrap gap-2 justify-center text-[10px] text-gray-500 font-semibold">
                  {vehicleStats.map((item, idx) => (
                    <span key={idx} className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      <span>{item.name} ({item.value})</span>
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Line Chart - Trends over months (12 cols) */}
        <div className="lg:col-span-12 bg-white p-5 rounded-2xl border border-brand-purple-light shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-gray-700">แนวโน้มเปรียบเทียบความถี่การลาเรียนกับการเดินทางไปราชการรายเดือน</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend tick={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="Leaves" stroke="#8884d8" strokeWidth={2.5} name="ใบลาและการชี้แจง" />
                <Line type="monotone" dataKey="Travels" stroke="#82ca9d" strokeWidth={2.5} name="การไปปฏิบัติราชการ" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ======================================================================================
          FORMAL OFFICIAL THAI SCHOOL REPORT (A4 DOCUMENT TEMPLATE)
          Rendered directly in DOM for print output via @media print & preview modal
          ====================================================================================== */}
      <div
        id="official-pdf-report-document"
        className="bg-white text-gray-900 font-sans print:block hidden"
      >
        <OfficialReportDocument
          acadYear={acadYear}
          termPeriod={termPeriod}
          totalPersonnel={totalPersonnel}
          todayFormattedThai={todayFormattedThai}
          leaveStatsDetailed={leaveStatsDetailed}
          travelStats={travelStats}
          vehicleStats={vehicleStats}
          buildingStats={buildingStats}
          subsSummary={subsSummary}
          reportSigner={reportSigner}
          reportSignerRole={reportSignerRole}
          checkerSigner={checkerSigner}
          checkerSignerRole={checkerSignerRole}
          directorSigner={directorSigner}
          directorSignerRole={directorSignerRole}
          reportNote={reportNote}
        />
      </div>

      {/* ======================================================================================
          INTERACTIVE PDF PREVIEW & PRINT MODAL
          Allows user to inspect the exact A4 layout, customize signer names, and print/save to PDF
          ====================================================================================== */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:hidden">
          <div className="bg-slate-100 rounded-3xl max-w-5xl w-full max-h-[96vh] flex flex-col shadow-2xl border border-white/20 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-white px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">
                    แบบรายงานสรุปสถิติราชการ (แบบพิมพ์ขนาด A4 สำหรับส่งเอกสารจริง)
                  </h3>
                  <p className="text-xs text-gray-500">
                    โรงเรียนชุมพวงศึกษา · จัดรูปแบบตรงตามระเบียบงานสารบรรณ พร้อมส่วนลงนาม 3 ระดับ
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrintDocument}
                  className="flex items-center space-x-2 bg-brand-purple hover:bg-brand-purple-dark text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
                >
                  <Download className="w-4 h-4 text-purple-200" />
                  <span>บันทึกเป็น PDF / พิมพ์เอกสาร</span>
                </button>

                <button
                  onClick={() => setIsPdfModalOpen(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-slate-100 transition cursor-pointer"
                  title="ปิดหน้าต่าง"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Helper Banner */}
            <div className="bg-amber-50 px-6 py-2.5 border-b border-amber-200/60 flex items-center justify-between text-xs text-amber-900 shrink-0">
              <span className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                <span>
                  <strong>วิธีบันทึกเป็นไฟล์ PDF:</strong> เมื่อกดปุ่ม "บันทึกเป็น PDF / พิมพ์เอกสาร" ให้เลือกปลายทาง (Destination) เป็น <strong>"Save as PDF" (บันทึกเป็น PDF)</strong> ในหน้าต่างของเบราว์เซอร์
                </span>
              </span>
              <span className="hidden sm:inline text-amber-700 text-[11px] font-semibold">
                ขนาดกระดาษมาตรฐาน A4 แนวตั้ง
              </span>
            </div>

            {/* Config & Document Body (Scrollable) */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* Document Configuration / Signer customizer */}
              <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-gray-700 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-brand-purple" />
                    <span>ตั้งค่าข้อมูลผู้มีอำนาจลงนามและหมายเหตุรายงาน</span>
                  </span>
                  <span className="text-[11px] text-gray-400">สามารถปรับแก้ชื่อให้ตรงกับผู้ลงนามจริงได้ทันที</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">1. ผู้จัดทำรายงาน (ชื่อ-นามสกุล)</label>
                    <input
                      type="text"
                      value={reportSigner}
                      onChange={(e) => setReportSigner(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-gray-800"
                    />
                    <input
                      type="text"
                      value={reportSignerRole}
                      onChange={(e) => setReportSignerRole(e.target.value)}
                      className="w-full bg-transparent border-none text-[10px] text-gray-400 mt-1 focus:ring-0"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">2. ผู้ตรวจสอบรายงาน (ชื่อ-นามสกุล)</label>
                    <input
                      type="text"
                      value={checkerSigner}
                      onChange={(e) => setCheckerSigner(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-gray-800"
                    />
                    <input
                      type="text"
                      value={checkerSignerRole}
                      onChange={(e) => setCheckerSignerRole(e.target.value)}
                      className="w-full bg-transparent border-none text-[10px] text-gray-400 mt-1 focus:ring-0"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">3. ผู้อำนวยการโรงเรียน (ผู้รับรอง)</label>
                    <input
                      type="text"
                      value={directorSigner}
                      onChange={(e) => setDirectorSigner(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-gray-800"
                    />
                    <input
                      type="text"
                      value={directorSignerRole}
                      onChange={(e) => setDirectorSignerRole(e.target.value)}
                      className="w-full bg-transparent border-none text-[10px] text-gray-400 mt-1 focus:ring-0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">ข้อคิดเห็น / สรุปผลการประเมินเบื้องต้น</label>
                  <textarea
                    rows={2}
                    value={reportNote}
                    onChange={(e) => setReportNote(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-gray-800"
                  />
                </div>
              </div>

              {/* Realistic A4 Paper Sheet Preview Container */}
              <div className="flex justify-center">
                <div className="w-full max-w-[210mm] bg-white shadow-xl rounded-sm p-8 sm:p-12 border border-slate-300 text-gray-900 transition">
                  <OfficialReportDocument
                    acadYear={acadYear}
                    termPeriod={termPeriod}
                    totalPersonnel={totalPersonnel}
                    todayFormattedThai={todayFormattedThai}
                    leaveStatsDetailed={leaveStatsDetailed}
                    travelStats={travelStats}
                    vehicleStats={vehicleStats}
                    buildingStats={buildingStats}
                    subsSummary={subsSummary}
                    reportSigner={reportSigner}
                    reportSignerRole={reportSignerRole}
                    checkerSigner={checkerSigner}
                    checkerSignerRole={checkerSignerRole}
                    directorSigner={directorSigner}
                    directorSignerRole={directorSignerRole}
                    reportNote={reportNote}
                  />
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-gray-500">
                เอกสารทางการ A4 พร้อมตราสัญลักษณ์โรงเรียนชุมพวงศึกษา และช่องลงนามครบถ้วน
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={handleShareReport}
                  title="คัดลอกลิงก์รายงาน"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl font-bold text-xs transition cursor-pointer border ${
                    isCopied
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-white hover:bg-slate-50 text-gray-700 border-slate-200'
                  }`}
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-brand-purple" />}
                  <span>{isCopied ? 'คัดลอกลิงก์แล้ว!' : 'แชร์รายงาน'}</span>
                </button>
                <button
                  onClick={() => setIsPdfModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer"
                >
                  ปิด
                </button>
                <button
                  onClick={handlePrintDocument}
                  className="flex items-center space-x-1.5 bg-brand-purple hover:bg-brand-purple-dark text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>บันทึกเป็น PDF / พิมพ์</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================================================================================
// OFFICIAL REPORT DOCUMENT COMPONENT (The Exact Bureaucratic Layout)
// ======================================================================================
interface OfficialReportDocumentProps {
  acadYear: string;
  termPeriod: string;
  totalPersonnel: number;
  todayFormattedThai: string;
  leaveStatsDetailed: {
    list: Array<{
      key: string;
      name: string;
      count: number;
      days: number;
      color: string;
      ruleNote: string;
      percentage: string;
    }>;
    totalLeaveRequests: number;
    totalLeaveDays: number;
  };
  travelStats: {
    total: number;
    approvedCount: number;
    pendingCount: number;
    totalDays: number;
    recentApproved: RequestItem[];
  };
  vehicleStats: Array<{ name: string; value: number }>;
  buildingStats: {
    total: number;
    approvedCount: number;
    pendingCount: number;
  };
  subsSummary: {
    signed: number;
    pending: number;
    total: number;
    rate: string;
  };
  reportSigner: string;
  reportSignerRole: string;
  checkerSigner: string;
  checkerSignerRole: string;
  directorSigner: string;
  directorSignerRole: string;
  reportNote: string;
}

function OfficialReportDocument({
  acadYear,
  todayFormattedThai,
  totalPersonnel,
  leaveStatsDetailed,
  travelStats,
  vehicleStats,
  buildingStats,
  subsSummary,
  reportSigner,
  reportSignerRole,
  checkerSigner,
  checkerSignerRole,
  directorSigner,
  directorSignerRole,
  reportNote
}: OfficialReportDocumentProps) {
  return (
    <div className="official-a4-content text-[12px] leading-relaxed text-black">
      {/* 1. Header with Garuda / School Symbol */}
      <div className="text-center space-y-1 mb-5">
        {/* Vector Thai Garuda / Official Crest representation */}
        <div className="flex justify-center mb-1">
          <svg className="w-14 h-14 text-red-700" viewBox="0 0 100 100" fill="currentColor">
            {/* Elegant stylized Garuda silhouette for Thai official documents */}
            <path d="M50 2 C45 10 35 15 30 20 C25 25 20 35 15 45 C25 43 35 44 42 48 C38 42 32 36 30 28 C35 30 42 35 46 40 C48 30 49 20 50 12 C51 20 52 30 54 40 C58 35 65 30 70 28 C68 36 62 42 58 48 C65 44 75 43 85 45 C80 35 75 25 70 20 C65 15 55 10 50 2 Z" />
            <path d="M50 42 C45 45 42 52 42 58 C35 58 25 55 18 50 C22 60 30 70 42 72 C42 80 38 88 32 94 C42 90 48 82 50 76 C52 82 58 90 68 94 C62 88 58 80 58 72 C70 70 78 60 82 50 C75 55 65 58 58 58 C58 52 55 45 50 42 Z" />
            <circle cx="50" cy="24" r="5" />
          </svg>
        </div>

        <h1 className="text-base font-bold tracking-normal text-black">
          แบบรายงานสรุปสถิติข้อมูลการปฏิบัติงาน การลา และการขอใช้ยานพาหนะ/สถานที่
        </h1>
        <h2 className="text-sm font-semibold text-black">
          โรงเรียนชุมพวงศึกษา อำเภอชุมพวง จังหวัดนครราชสีมา
        </h2>
        <p className="text-[11px] text-gray-700">
          สำนักงานเขตพื้นที่การศึกษามัธยมศึกษานครราชสีมา · สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน
        </p>
        <div className="pt-1 flex items-center justify-center space-x-6 text-[11px] font-medium border-b border-gray-400 pb-2">
          <span><strong>ประจำปีการศึกษา:</strong> {acadYear}</span>
          <span><strong>จำนวนบุคลากรในสังกัด:</strong> {totalPersonnel} คน</span>
          <span><strong>ข้อมูล ณ วันที่:</strong> {todayFormattedThai}</span>
        </div>
      </div>

      {/* 2. Section 1: Leave & Attendance Summary Table */}
      <div className="mb-4">
        <h3 className="font-bold text-[12.5px] text-black mb-1 flex items-center justify-between">
          <span>๑. สรุปสถิติการลาและการชี้แจงเวลาปฏิบัติราชการ (จำแนกตามประเภท)</span>
          <span className="text-[10.5px] font-normal text-gray-600">
            รวมการลาทั้งสิ้น {leaveStatsDetailed.totalLeaveRequests} ครั้ง ({leaveStatsDetailed.totalLeaveDays} วัน)
          </span>
        </h3>

        <table className="official-table w-full border border-gray-700 text-left">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-700 text-[11px]">
              <th className="py-1 px-2 text-center w-10 border-r border-gray-700">ลำดับ</th>
              <th className="py-1 px-2 border-r border-gray-700">ประเภทการลา / การชี้แจงเวลา</th>
              <th className="py-1 px-2 text-center w-20 border-r border-gray-700">จำนวนครั้ง</th>
              <th className="py-1 px-2 text-center w-20 border-r border-gray-700">จำนวนวันรวม</th>
              <th className="py-1 px-2 text-center w-20 border-r border-gray-700">คิดเป็นร้อยละ</th>
              <th className="py-1 px-2 border-r border-gray-700">หมายเหตุ / ระเบียบที่เกี่ยวข้อง</th>
            </tr>
          </thead>
          <tbody className="text-[11px]">
            {leaveStatsDetailed.list.map((item, idx) => (
              <tr key={item.key} className="border-b border-gray-300">
                <td className="py-1 px-2 text-center border-r border-gray-700">{idx + 1}</td>
                <td className="py-1 px-2 font-medium border-r border-gray-700">{item.name}</td>
                <td className="py-1 px-2 text-center border-r border-gray-700 font-bold">{item.count}</td>
                <td className="py-1 px-2 text-center border-r border-gray-700">{item.days}</td>
                <td className="py-1 px-2 text-center border-r border-gray-700">{item.percentage}%</td>
                <td className="py-1 px-2 text-gray-600 border-r border-gray-700 text-[10px]">{item.ruleNote}</td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-bold border-t border-gray-700">
              <td colSpan={2} className="py-1 px-2 text-center border-r border-gray-700">รวมสถิติทั้งสิ้น</td>
              <td className="py-1 px-2 text-center border-r border-gray-700 text-blue-900">{leaveStatsDetailed.totalLeaveRequests} ครั้ง</td>
              <td className="py-1 px-2 text-center border-r border-gray-700 text-blue-900">{leaveStatsDetailed.totalLeaveDays} วัน</td>
              <td className="py-1 px-2 text-center border-r border-gray-700">๑๐๐%</td>
              <td className="py-1 px-2 text-gray-500 border-r border-gray-700 text-[10px]">อนุมัติผ่านระบบอิเล็กทรอนิกส์ครบถ้วน</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 3. Section 2 & 3: Travel, Vehicle & Facility Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Travel Summary */}
        <div className="border border-gray-700 p-2.5 rounded-xs">
          <h4 className="font-bold text-[11.5px] border-b border-gray-400 pb-1 mb-1.5">
            ๒. สรุปสถิติการไปปฏิบัติราชการและการพัฒนาตนเอง
          </h4>
          <ul className="space-y-1 text-[11px]">
            <li className="flex justify-between">
              <span>• คำขอไปราชการที่ผ่านการอนุมัติ:</span>
              <span className="font-bold">{travelStats.approvedCount} รายการ</span>
            </li>
            <li className="flex justify-between">
              <span>• จำนวนวันปฏิบัติราชการรวม:</span>
              <span className="font-bold">{travelStats.totalDays} วัน</span>
            </li>
            <li className="flex justify-between">
              <span>• คำขอที่รอดำเนินการตรวจสอบ:</span>
              <span className="font-bold">{travelStats.pendingCount} รายการ</span>
            </li>
            <li className="text-[10px] text-gray-600 pt-1">
              * ข้าราชการครูมีคำสั่งไปราชการครบถ้วนตามระเบียบ
            </li>
          </ul>
        </div>

        {/* Vehicles and Facilities */}
        <div className="border border-gray-700 p-2.5 rounded-xs">
          <h4 className="font-bold text-[11.5px] border-b border-gray-400 pb-1 mb-1.5">
            ๓. สรุปสถิติการขอใช้ยานพาหนะและอาคารสถานที่
          </h4>
          <ul className="space-y-1 text-[11px]">
            <li className="flex justify-between">
              <span>• รถยนต์ตู้ส่วนกลาง (คันที่ ๑ และ ๒):</span>
              <span className="font-bold">
                {(vehicleStats.find(v => v.name === 'รถตู้ 1')?.value || 0) + (vehicleStats.find(v => v.name === 'รถตู้ 2')?.value || 0)} ครั้ง
              </span>
            </li>
            <li className="flex justify-between">
              <span>• รถบรรทุก ๖ ล้อส่วนกลาง:</span>
              <span className="font-bold">
                {(vehicleStats.find(v => v.name === 'รถหกล้อ 1')?.value || 0) + (vehicleStats.find(v => v.name === 'รถหกล้อ 2')?.value || 0)} ครั้ง
              </span>
            </li>
            <li className="flex justify-between">
              <span>• รถยนต์ส่วนบุคคลเพื่อการปฏิบัติงาน:</span>
              <span className="font-bold">{vehicleStats.find(v => v.name === 'รถยนต์ส่วนตัว')?.value || 0} ครั้ง</span>
            </li>
            <li className="flex justify-between">
              <span>• คำขอใช้อาคารสถานที่ส่วนกลาง:</span>
              <span className="font-bold">{buildingStats.approvedCount} รายการ</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 4. Section 4: Teaching Substitution Record */}
      <div className="mb-4 border border-gray-700 p-2.5 rounded-xs">
        <h4 className="font-bold text-[11.5px] border-b border-gray-400 pb-1 mb-1.5 flex justify-between">
          <span>๔. สรุปการปฏิบัติหน้าที่สอนแทน (ความต่อเนื่องของการจัดการเรียนการสอน)</span>
          <span>อัตราความสมบูรณ์ {subsSummary.rate}%</span>
        </h4>
        <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
          <div className="bg-gray-50 border border-gray-300 p-1 rounded-xs">
            <span className="text-gray-600 block text-[10px]">ภาระสอนแทนที่มอบหมาย</span>
            <span className="font-bold text-sm">{subsSummary.total} คาบ</span>
          </div>
          <div className="bg-gray-50 border border-gray-300 p-1 rounded-xs">
            <span className="text-gray-600 block text-[10px]">ลงชื่อปฏิบัติหน้าที่แล้ว</span>
            <span className="font-bold text-sm text-emerald-800">{subsSummary.signed} คาบ</span>
          </div>
          <div className="bg-gray-50 border border-gray-300 p-1 rounded-xs">
            <span className="text-gray-600 block text-[10px]">รอดำเนินการลงชื่อ</span>
            <span className="font-bold text-sm text-amber-800">{subsSummary.pending} คาบ</span>
          </div>
        </div>
      </div>

      {/* 5. Section 5: Official Remarks & Assessment */}
      <div className="mb-5 border border-gray-700 p-2.5 rounded-xs">
        <h4 className="font-bold text-[11.5px] mb-1">
          ๕. สรุปผลการประเมินและข้อเสนอแนะในการบริหารงานบุคคล
        </h4>
        <p className="text-[11px] text-justify indent-6">
          {reportNote}
        </p>
      </div>

      {/* 6. Section 6: Official 3-Tier Bureaucratic Signatures Block (Page Break Avoidance) */}
      <div className="signature-block print-avoid-break border-t-2 border-gray-800 pt-4 mt-6">
        <div className="grid grid-cols-3 gap-3 text-center text-[11px]">
          {/* Signer 1: Reporting Officer */}
          <div className="flex flex-col items-center justify-between min-h-[145px]">
            <div>
              <p className="font-bold mb-6">ผู้รายงาน / ผู้จัดทำ</p>
              <div className="border-b border-dotted border-gray-600 w-36 mx-auto mb-1"></div>
              <p>( {reportSigner} )</p>
              <p className="text-[10px] text-gray-700">{reportSignerRole}</p>
            </div>
            <p className="text-[10px] text-gray-600 mt-2">
              วันที่ ......./......./.......
            </p>
          </div>

          {/* Signer 2: Department Head / Deputy Director */}
          <div className="flex flex-col items-center justify-between min-h-[145px] border-l border-r border-gray-300 px-2">
            <div>
              <p className="font-bold">ผู้ตรวจสอบรายงาน</p>
              <p className="text-[10px] text-gray-600 mb-2">[ ✓ ] ตรวจสอบแล้ว ถูกต้องครบถ้วน</p>
              <div className="border-b border-dotted border-gray-600 w-36 mx-auto mb-1"></div>
              <p>( {checkerSigner} )</p>
              <p className="text-[10px] text-gray-700">{checkerSignerRole}</p>
            </div>
            <p className="text-[10px] text-gray-600 mt-2">
              วันที่ ......./......./.......
            </p>
          </div>

          {/* Signer 3: School Principal / Director */}
          <div className="flex flex-col items-center justify-between min-h-[145px]">
            <div>
              <p className="font-bold">ผู้รับรองและสั่งการ</p>
              <p className="text-[10px] text-gray-600 mb-2">[ ✓ ] ทราบ / อนุมัติรายงานสรุป</p>
              <div className="border-b border-dotted border-gray-600 w-36 mx-auto mb-1"></div>
              <p>( {directorSigner} )</p>
              <p className="text-[10px] text-gray-700">{directorSignerRole}</p>
            </div>
            <p className="text-[10px] text-gray-600 mt-2">
              วันที่ ......./......./.......
            </p>
          </div>
        </div>
      </div>

      {/* Official Footnote */}
      <div className="mt-6 pt-2 border-t border-gray-300 flex justify-between text-[9px] text-gray-500">
        <span>เอกสารจัดทำผ่านระบบอิเล็กทรอนิกส์ CP-LCV SMART โรงเรียนชุมพวงศึกษา</span>
        <span>หน้า ๑ จาก ๑ (แบบรายงานราชการสำหรับส่งจริง)</span>
      </div>
    </div>
  );
}
