import React, { useState } from 'react';
import { User, RequestItem, DailyStat, VehicleBooking, BuildingBooking, LeaveBalance, EdocOrder, CertificateRequest } from '../types';
import { Calendar as CalendarIcon, Car, Building2, Eye, Plus, ArrowRight, UserCheck, ShieldAlert, FileCheck, CheckCircle2, AlertCircle, Bell, Send, Award, FileSpreadsheet, UserPlus } from 'lucide-react';

interface DashboardProps {
  currentUser: User | null;
  users: User[];
  requests: RequestItem[];
  dailyStats: DailyStat[];
  vehicleBookings: VehicleBooking[];
  buildingBookings: BuildingBooking[];
  leaveBalances: LeaveBalance[];
  edocs?: EdocOrder[];
  certs?: CertificateRequest[];
  onAddVehicleBooking: (booking: Omit<VehicleBooking, 'id' | 'status'>) => void;
  onAddBuildingBooking: (booking: Omit<BuildingBooking, 'id' | 'status'>) => void;
  onAddEdoc?: (edoc: Omit<EdocOrder, 'id'>) => void;
  onAddCert?: (cert: Omit<CertificateRequest, 'id'>) => void;
  onAddAbsentPersonnel?: (data: { userName: string; type: 'sick' | 'personal' | 'travel'; date: string; reason: string }) => void;
  onSendIndividualNotice?: (targetUserName: string, message: string) => void;
}

export default function Dashboard({
  currentUser,
  users,
  requests,
  dailyStats,
  vehicleBookings,
  buildingBookings,
  leaveBalances,
  edocs = [],
  certs = [],
  onAddVehicleBooking,
  onAddBuildingBooking,
  onAddEdoc,
  onAddCert,
  onAddAbsentPersonnel,
  onSendIndividualNotice
}: DashboardProps) {
  // Check if current user is Admin
  const isAdmin = currentUser && (
    currentUser.position.includes('แอดมิน') || 
    currentUser.position.includes('ผู้ดูแลระบบ') || 
    currentUser.id === 'u0'
  );

  // Modal display states
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [showAddAbsentModal, setShowAddAbsentModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showEdocModal, setShowEdocModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [historyYear, setHistoryYear] = useState<string>('2569');
  
  // Leave Summary filtering
  const [leaveFilterPeriod, setLeaveFilterPeriod] = useState<'p1' | 'p2'>('p1');
  const [leaveFilterYear, setLeaveFilterYear] = useState<string>('2569');

  // Form states - Vehicle Booking
  const [vName, setVName] = useState(currentUser?.name || '');
  const [vPurpose, setVPurpose] = useState('');
  const [vPassengers, setVPassengers] = useState(1);
  const [vDestination, setVDestination] = useState('');
  const [vDateStart, setVDateStart] = useState('');
  const [vDateEnd, setVDateEnd] = useState('');
  const [vTimeStart, setVTimeStart] = useState('');
  const [vTimeEnd, setVTimeEnd] = useState('');
  const [vType, setVType] = useState('รถตู้ 1');
  const [vDriver, setVDriver] = useState('');

  // Form states - Building Booking
  const [bName, setBName] = useState(currentUser?.name || '');
  const [bBuilding, setBBuilding] = useState('หอประชุมโรงเรียนชุมพวงศึกษา');
  const [bPurpose, setBPurpose] = useState('');
  const [bDate, setBDate] = useState('');
  const [bTimeStart, setBTimeStart] = useState('');
  const [bTimeEnd, setBTimeEnd] = useState('');

  // Form states - Admin Add Absent Personnel
  const [absentUser, setAbsentUser] = useState('');
  const [absentType, setAbsentType] = useState<'sick' | 'personal' | 'travel'>('travel');
  const [absentDate, setAbsentDate] = useState(new Date().toISOString().split('T')[0]);
  const [absentReason, setAbsentReason] = useState('');

  // Form states - Admin Send Notice
  const [noticeTargetUser, setNoticeTargetUser] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('🔔 แจ้งเตือนจากแอดมิน: กรุณาลงเวลาปฏิบัติราชการ/ลงเวลาทำงานประจำวันในระบบ CP-LCV SMART ค่ะ/ครับ');

  // Form states - Order Request (Edoc)
  const [edocTitle, setEdocTitle] = useState('');
  const [edocTravelers, setEdocTravelers] = useState('');
  const [edocDate, setEdocDate] = useState(new Date().toISOString().split('T')[0]);
  const [edocLocation, setEdocLocation] = useState('');
  const [edocGroup, setEdocGroup] = useState(currentUser?.group || 'กลุ่มสาระการเรียนรู้คณิตศาสตร์');

  // Form states - Certificate Request (Cert)
  const [certApplicant, setCertApplicant] = useState(currentUser?.name || '');
  const [certDate, setCertDate] = useState(new Date().toISOString().split('T')[0]);
  const [certTopic, setCertTopic] = useState('');
  const [certCount, setCertCount] = useState(1);

  // Auto fill names on change
  React.useEffect(() => {
    if (currentUser) {
      setVName(currentUser.name);
      setBName(currentUser.name);
      setCertApplicant(currentUser.name);
    }
  }, [currentUser]);

  // Compute personnel statistics (excluding Admin position)
  const dailyWorkStats = React.useMemo(() => {
    const categories = {
      administration: { name: 'ฝ่ายบริหาร', total: 0, present: 0, absent: 0, leaveTypes: { sick: 0, personal: 0, travel: 0, other: 0 } },
      math: { name: 'กลุ่มสาระการเรียนรู้คณิตศาสตร์', total: 0, present: 0, absent: 0, leaveTypes: { sick: 0, personal: 0, travel: 0, other: 0 } },
      science: { name: 'กลุ่มสาระการเรียนวิทยาศาสตร์และเทคโนโลยี', total: 0, present: 0, absent: 0, leaveTypes: { sick: 0, personal: 0, travel: 0, other: 0 } },
      thai: { name: 'กลุ่มสาระการเรียนรู้ภาษาไทย', total: 0, present: 0, absent: 0, leaveTypes: { sick: 0, personal: 0, travel: 0, other: 0 } },
      social: { name: 'กลุ่มสาระการเรียนรู้สังคมศึกษา', total: 0, present: 0, absent: 0, leaveTypes: { sick: 0, personal: 0, travel: 0, other: 0 } },
      career: { name: 'กลุ่มสาระการเรียนรู้การงานอาชีพ', total: 0, present: 0, absent: 0, leaveTypes: { sick: 0, personal: 0, travel: 0, other: 0 } },
      health: { name: 'กลุ่มสาระการเรียนรู้สุขศึกษาและพลศึกษา', total: 0, present: 0, absent: 0, leaveTypes: { sick: 0, personal: 0, travel: 0, other: 0 } },
      foreign: { name: 'กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ', total: 0, present: 0, absent: 0, leaveTypes: { sick: 0, personal: 0, travel: 0, other: 0 } },
      art: { name: 'กลุ่มสาระการเรียนรู้ศิลปะ', total: 0, present: 0, absent: 0, leaveTypes: { sick: 0, personal: 0, travel: 0, other: 0 } },
      staff: { name: 'เจ้าหน้าที่', total: 0, present: 0, absent: 0, leaveTypes: { sick: 0, personal: 0, travel: 0, other: 0 } },
      employee: { name: 'ลูกจ้าง', total: 0, present: 0, absent: 0, leaveTypes: { sick: 0, personal: 0, travel: 0, other: 0 } },
      student_teacher: { name: 'นักศึกษาฝึกปฏิบัติการณ์', total: 0, present: 0, absent: 0, leaveTypes: { sick: 0, personal: 0, travel: 0, other: 0 } }
    };

    const targetDate = selectedDate || new Date().toISOString().split('T')[0];

    (users || []).forEach(u => {
      const pos = (u.position || '').trim();
      const grp = (u.group || '').trim();

      // EXCLUDE Admin position from personnel count & stats
      if (pos.includes('แอดมิน') || pos.includes('ผู้ดูแลระบบ') || u.id === 'u0' || grp === '-' || grp === 'ไม่สังกัดกลุ่มงาน') {
        return;
      }
      
      let catKey: keyof typeof categories = 'staff';
      
      if (grp === 'ฝ่ายบริหาร' || pos.includes('ผู้อำนวยการ') || pos.includes('รองผู้อำนวยการ') || pos.includes('ฝ่ายบริหาร')) {
        catKey = 'administration';
      } else if (pos.includes('นักศึกษาฝึก') || pos.includes('ฝึกประสบการณ์') || pos.includes('ฝึกปฏิบัติการณ์')) {
        catKey = 'student_teacher';
      } else if (pos === 'ลูกจ้าง') {
        catKey = 'employee';
      } else if (pos.includes('เจ้าหน้าที่') || pos === 'พนักงานราชการ' || pos.includes('ธุรการ') || pos.includes('พัสดุ') || pos.includes('การเงิน')) {
        catKey = 'staff';
      } else if (grp.includes('คณิตศาสตร์')) {
        catKey = 'math';
      } else if (grp.includes('วิทยาศาสตร์')) {
        catKey = 'science';
      } else if (grp.includes('ภาษาไทย')) {
        catKey = 'thai';
      } else if (grp.includes('สังคมศึกษา')) {
        catKey = 'social';
      } else if (grp.includes('การงานอาชีพ')) {
        catKey = 'career';
      } else if (grp.includes('สุขศึกษา')) {
        catKey = 'health';
      } else if (grp.includes('ภาษาต่างประเทศ')) {
        catKey = 'foreign';
      } else if (grp.includes('ศิลปะ')) {
        catKey = 'art';
      } else {
        catKey = 'staff';
      }

      const cat = categories[catKey];
      cat.total++;

      // Check if user has an approved leave/travel request on targetDate
      const activeRequest = (requests || []).find(r => {
        if (r.applicantName !== u.name || r.status !== 'approved') return false;
        
        const dTarget = new Date(targetDate);
        const dStart = new Date(r.dateStart);
        const dEnd = new Date(r.dateEnd);
        
        dTarget.setHours(0,0,0,0);
        dStart.setHours(0,0,0,0);
        dEnd.setHours(0,0,0,0);
        
        return dTarget >= dStart && dTarget <= dEnd;
      });

      if (activeRequest) {
        cat.absent++;
        const leaveType = activeRequest.type;
        if (leaveType === 'sick') cat.leaveTypes.sick++;
        else if (leaveType === 'personal') cat.leaveTypes.personal++;
        else if (leaveType === 'travel') cat.leaveTypes.travel++;
        else cat.leaveTypes.other++;
      } else {
        cat.present++;
      }
    });

    const summary = {
      name: 'สรุปรวมทั้งหมด (ไม่รวมแอดมิน)',
      total: 0,
      present: 0,
      absent: 0,
      leaveTypes: { sick: 0, personal: 0, travel: 0, other: 0 }
    };

    Object.values(categories).forEach(c => {
      summary.total += c.total;
      summary.present += c.present;
      summary.absent += c.absent;
      summary.leaveTypes.sick += c.leaveTypes.sick;
      summary.leaveTypes.personal += c.leaveTypes.personal;
      summary.leaveTypes.travel += c.leaveTypes.travel;
      summary.leaveTypes.other += c.leaveTypes.other;
    });

    return {
      list: Object.values(categories),
      summary
    };
  }, [users, requests, selectedDate]);

  // Unclocked users for Admin Notice feature
  const unclockedUsers = React.useMemo(() => {
    const targetDate = selectedDate || new Date().toISOString().split('T')[0];
    return (users || []).filter(u => {
      if (u.position.includes('แอดมิน') || u.position.includes('ผู้ดูแลระบบ') || u.id === 'u0') return false;
      
      const hasLeave = (requests || []).some(r => {
        if (r.applicantName !== u.name || r.status !== 'approved') return false;
        const dTarget = new Date(targetDate);
        const dStart = new Date(r.dateStart);
        const dEnd = new Date(r.dateEnd);
        dTarget.setHours(0,0,0,0);
        dStart.setHours(0,0,0,0);
        dEnd.setHours(0,0,0,0);
        return dTarget >= dStart && dTarget <= dEnd;
      });

      return !hasLeave;
    });
  }, [users, requests, selectedDate]);

  // Approved leaves today
  const approvedLeavesToday = requests.filter(r => {
    return r.status === 'approved' && 
      (new Date(r.dateStart) <= new Date() && new Date(r.dateEnd) >= new Date());
  });

  // Substitutions today for current logged in user
  const mySubstitutions = requests.flatMap(r => {
    return (r.substitutions || []).filter(sub => 
      sub.substituteTeacherName === currentUser?.name && 
      r.status === 'approved' &&
      r.dateStart === new Date().toISOString().split('T')[0]
    );
  });

  // Calculate leave summary for logged-in user
  const myLeaveStats = React.useMemo(() => {
    if (!currentUser) return { sick: 0, personal: 0, late: 0, permission: 0 };
    
    const yearAD = parseInt(leaveFilterYear) - 543;
    let startRangeStr = '';
    let endRangeStr = '';
    
    if (leaveFilterPeriod === 'p1') {
      startRangeStr = `${yearAD - 1}-10-01`;
      endRangeStr = `${yearAD}-03-31`;
    } else {
      startRangeStr = `${yearAD}-04-01`;
      endRangeStr = `${yearAD}-09-30`;
    }
    
    const startDate = new Date(startRangeStr);
    const endDate = new Date(endRangeStr);
    
    let sick = 0;
    let personal = 0;
    let late = 0;
    let permission = 0;
    
    requests.forEach(r => {
      if (r.applicantName !== currentUser.name || r.status !== 'approved') return;
      const rDate = new Date(r.dateStart);
      if (rDate >= startDate && rDate <= endDate) {
        if (r.type === 'sick') sick++;
        else if (r.type === 'personal') personal++;
        else if (r.type === 'attendance' || r.type === 'return_time') late++;
        else if (r.type === 'out_of_bounds') permission++;
      }
    });
    
    return { sick, personal, late, permission };
  }, [currentUser, requests, leaveFilterPeriod, leaveFilterYear]);

  // Combined vehicle bookings
  const allVehicleBookings = React.useMemo(() => {
    const list: Array<{
      no: number;
      booker: string;
      date: string;
      time: string;
      vehicle: string;
      driver: string;
      status: string;
      rawDate: string;
    }> = [];

    let count = 1;

    vehicleBookings.forEach(v => {
      list.push({
        no: count++,
        booker: v.applicantName,
        date: `${v.dateStart} ถึง ${v.dateEnd}`,
        time: `${v.timeStart} - ${v.timeEnd}`,
        vehicle: v.vehicleType,
        driver: v.driverName || 'รอดำเนินการ',
        status: v.status === 'approved' ? 'อนุมัติ' : v.status === 'rejected' ? 'ไม่อนุมัติ' : 'รออนุมัติ',
        rawDate: v.dateStart
      });
    });

    requests.forEach(r => {
      if (r.type === 'travel' && r.vehicleType && r.vehicleType.startsWith('central')) {
        let vTypeThai = 'รถตู้ 1';
        if (r.vehicleType === 'central_van_2') vTypeThai = 'รถตู้ 2';
        else if (r.vehicleType === 'central_truck_1') vTypeThai = 'รถหกล้อ 1';
        else if (r.vehicleType === 'central_truck_2') vTypeThai = 'รถหกล้อ 2';

        list.push({
          no: count++,
          booker: r.applicantName,
          date: `${r.dateStart} ถึง ${r.dateEnd}`,
          time: `${r.timeStart} - ${r.timeEnd}`,
          vehicle: vTypeThai,
          driver: r.driverName || 'รอดำเนินการ',
          status: r.status === 'approved' ? 'อนุมัติ' : r.status === 'rejected' ? 'ไม่อนุมัติ' : 'รออนุมัติ',
          rawDate: r.dateStart
        });
      }
    });

    return list.sort((a, b) => b.rawDate.localeCompare(a.rawDate));
  }, [vehicleBookings, requests]);

  const daysInMonth = () => {
    const d = new Date(selectedDate);
    const year = d.getFullYear();
    const month = d.getMonth();
    const date = new Date(year, month, 1);
    const result = [];
    while (date.getMonth() === month) {
      result.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return result;
  };

  const handleVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddVehicleBooking({
      applicantName: vName,
      purpose: vPurpose,
      passengerCount: vPassengers,
      destination: vDestination,
      dateStart: vDateStart,
      dateEnd: vDateEnd,
      timeStart: vTimeStart,
      timeEnd: vTimeEnd,
      vehicleType: vType,
      driverName: vDriver
    });
    setShowVehicleModal(false);
    setVPurpose('');
    setVPassengers(1);
    setVDestination('');
    setVDateStart('');
    setVDateEnd('');
    setVTimeStart('');
    setVTimeEnd('');
    setVDriver('');
  };

  const handleBuildingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddBuildingBooking({
      applicantName: bName,
      buildingName: bBuilding,
      purpose: bPurpose,
      dateStart: bDate,
      timeStart: bTimeStart,
      timeEnd: bTimeEnd
    });
    setShowBuildingModal(false);
    setBPurpose('');
    setBDate('');
    setBTimeStart('');
    setBTimeEnd('');
  };

  const handleAbsentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!absentUser) {
      alert('กรุณาเลือกบุคลากร');
      return;
    }
    if (onAddAbsentPersonnel) {
      onAddAbsentPersonnel({
        userName: absentUser,
        type: absentType,
        date: absentDate,
        reason: absentReason || (absentType === 'travel' ? 'ไปราชการติดตามภารกิจ' : 'การลาประจำวัน')
      });
    }
    setShowAddAbsentModal(false);
    setAbsentUser('');
    setAbsentReason('');
  };

  const handleNoticeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTargetUser) return;
    if (onSendIndividualNotice) {
      onSendIndividualNotice(noticeTargetUser, noticeMessage);
    }
    setShowNoticeModal(false);
  };

  const handleEdocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddEdoc) {
      const nextNum = (edocs.length + 1).toString().padStart(3, '0');
      onAddEdoc({
        requestId: `edoc-req-${Date.now()}`,
        commandNo: `${nextNum}/2569`,
        title: edocTitle,
        travelNames: edocTravelers.split(',').map(s => s.trim()).filter(Boolean),
        dateStr: edocDate,
        location: edocLocation,
        groupNotes: edocGroup,
        status: 'เรียบร้อย'
      });
    }
    setShowEdocModal(false);
    setEdocTitle('');
    setEdocTravelers('');
    setEdocLocation('');
  };

  const handleCertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddCert) {
      const lastStartNo = certs.reduce((max, c) => Math.max(max, (c.startNo || 1) + c.certCount), 1);
      onAddCert({
        applicantName: certApplicant,
        requestDate: certDate,
        topic: certTopic,
        certCount: Number(certCount),
        startNo: lastStartNo
      });
    }
    setShowCertModal(false);
    setCertTopic('');
    setCertCount(1);
  };

  const getVehicleColorClass = (vType: string) => {
    switch (vType) {
      case 'รถตู้ 1': return 'bg-red-500 text-white';
      case 'รถตู้ 2': return 'bg-green-500 text-white';
      case 'รถหกล้อ 1': return 'bg-sky-500 text-white';
      case 'รถหกล้อ 2': return 'bg-pink-500 text-white';
      default: return 'bg-purple-500 text-white';
    }
  };

  return (
    <div id="dashboard-tab" className="space-y-8">
      {/* Dynamic Substitution Alert */}
      {mySubstitutions.length > 0 && (
        <div id="sub-notice" className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm animate-pulse">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <h4 className="font-semibold text-amber-900">แจ้งเตือนมอบหมายสอนแทนวันนี้!</h4>
          </div>
          <div className="mt-2 space-y-1">
            {mySubstitutions.map((sub, index) => (
              <p key={index} className="text-sm text-amber-800">
                คุณได้รับมอบหมายสอนแทนในคาบ <strong>{sub.period}</strong> วิชา {sub.courseCode} {sub.courseName} ชั้น {sub.className} แทน {sub.teacherName}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Statistics & Leave List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Stats Table */}
        <div id="attendance-card" className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-brand-purple-light flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                  <span>ตารางสถิติปฏิบัติงานประจำวัน</span>
                  <span className="text-xs bg-purple-100 text-brand-purple-dark font-bold px-2 py-0.5 rounded-full">เรียลไทม์</span>
                </h3>
                <p className="text-xs text-gray-500">รายงานข้อมูลปฏิบัติงานจำแนกตามสายงานประจำวันที่เลือก (ไม่รวมผู้ดูแลระบบ)</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 font-medium">ระบุวันที่:</span>
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs bg-slate-50 border border-purple-100 rounded-lg px-2.5 py-1.5 font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-purple"
                />
                <button 
                  id="view-history-btn"
                  onClick={() => setShowHistoryModal(true)}
                  className="flex items-center space-x-1 text-xs text-brand-purple hover:text-brand-purple-dark font-semibold border border-brand-purple/20 px-3 py-1.5 rounded-full bg-white transition hover:bg-purple-50"
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>ดูประวัติ</span>
                </button>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="overflow-x-auto border border-purple-50 rounded-xl shadow-sm mb-4">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-gray-700 font-bold border-b border-purple-100 text-xs sm:text-sm">
                    <th className="p-3">ประเภทบุคลากร / ฝ่าย</th>
                    <th className="p-3 text-center">บุคลากรทั้งหมด (คน)</th>
                    <th className="p-3 text-center text-emerald-700 bg-emerald-50/40">มาปฏิบัติงาน (คน)</th>
                    <th className="p-3 text-center text-amber-700 bg-amber-50/40">ลาป่วย (คน)</th>
                    <th className="p-3 text-center text-amber-700 bg-amber-50/40">ลากิจ (คน)</th>
                    <th className="p-3 text-center text-sky-700 bg-sky-50/40">ไปราชการ (คน)</th>
                    <th className="p-3 text-center">อัตราการมา (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50/50">
                  {dailyWorkStats.list.map((c, idx) => {
                    const presenceRate = c.total > 0 ? Math.round((c.present / c.total) * 100) : 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 transition">
                        <td className="p-3 font-semibold text-gray-800">{c.name}</td>
                        <td className="p-3 text-center font-bold text-gray-600">{c.total}</td>
                        <td className="p-3 text-center font-bold text-emerald-600 bg-emerald-50/10">{c.present}</td>
                        <td className="p-3 text-center font-semibold text-amber-600 bg-amber-50/10">{c.leaveTypes.sick || '-'}</td>
                        <td className="p-3 text-center font-semibold text-amber-600 bg-amber-50/10">{c.leaveTypes.personal || '-'}</td>
                        <td className="p-3 text-center font-semibold text-sky-600 bg-sky-50/10">{c.leaveTypes.travel || '-'}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block font-bold px-2.5 py-0.5 rounded-full text-xs ${
                            presenceRate === 100 ? 'bg-emerald-100 text-emerald-800' :
                            presenceRate >= 80 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {presenceRate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Summary row */}
                  <tr className="bg-purple-50/60 font-bold border-t border-purple-100 text-brand-purple-dark text-sm sm:text-base">
                    <td className="p-3 font-bold text-brand-purple-dark flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 bg-brand-purple rounded-full"></span>
                      <span>{dailyWorkStats.summary.name}</span>
                    </td>
                    <td className="p-3 text-center font-bold">{dailyWorkStats.summary.total}</td>
                    <td className="p-3 text-center font-bold text-emerald-700 bg-emerald-50/30">{dailyWorkStats.summary.present}</td>
                    <td className="p-3 text-center font-bold text-amber-700 bg-amber-50/30">{dailyWorkStats.summary.leaveTypes.sick || '0'}</td>
                    <td className="p-3 text-center font-bold text-amber-700 bg-amber-50/30">{dailyWorkStats.summary.leaveTypes.personal || '0'}</td>
                    <td className="p-3 text-center font-bold text-sky-700 bg-sky-300/30">{dailyWorkStats.summary.leaveTypes.travel || '0'}</td>
                    <td className="p-3 text-center">
                      <span className="bg-brand-purple text-white px-3 py-1 rounded-full text-xs font-bold">
                        {dailyWorkStats.summary.total > 0 ? Math.round((dailyWorkStats.summary.present / dailyWorkStats.summary.total) * 100) : 0}%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl flex flex-col sm:flex-row justify-between items-center text-sm gap-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-gray-600 font-medium">อัตราปฏิบัติงานรวมวันนี้:</span>
              <strong className="text-emerald-700 text-base">
                {dailyWorkStats.summary.total > 0 ? Math.round((dailyWorkStats.summary.present / dailyWorkStats.summary.total) * 100) : 0}%
              </strong>
            </div>
            <div className="flex flex-wrap space-x-4 text-xs sm:text-sm text-gray-500 font-semibold">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                <span>มาทำงาน: {dailyWorkStats.summary.present} คน</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                <span>ลา: {dailyWorkStats.summary.leaveTypes.sick + dailyWorkStats.summary.leaveTypes.personal + dailyWorkStats.summary.leaveTypes.other} คน</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 bg-sky-500 rounded-full"></span>
                <span>ราชการ: {dailyWorkStats.summary.leaveTypes.travel} คน</span>
              </span>
            </div>
          </div>
        </div>

        {/* Leave List Today */}
        <div id="leaves-today-card" className="bg-white p-6 rounded-2xl shadow-sm border border-brand-purple-light flex flex-col justify-between h-full">
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">รายชื่อบุคลากรลา/ราชการวันนี้</h3>
                <p className="text-xs text-gray-500 mb-2">แสดงคำร้องที่ได้รับอนุมัติในระบบเรียบร้อยแล้ว</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowAddAbsentModal(true)}
                  className="flex items-center space-x-1 text-xs bg-brand-purple text-white px-2.5 py-1.5 rounded-lg hover:bg-brand-purple-dark transition shadow-sm font-semibold shrink-0"
                  title="แอดมินสามารถเพิ่มรายชื่อบุคลากรลา/ราชการวันนี้"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มข้อมูล</span>
                </button>
              )}
            </div>
            
            <div className="space-y-3 overflow-y-auto max-h-56 pr-1">
              {approvedLeavesToday.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm flex flex-col items-center">
                  <UserCheck className="w-12 h-12 text-gray-200 mb-2" />
                  <span>วันนี้บุคลากรทุกคนมาปฏิบัติงานครบถ้วน</span>
                </div>
              ) : (
                approvedLeavesToday.map((r, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-purple-50/50 rounded-xl border border-purple-50">
                    <span className="font-medium text-sm text-gray-800">{r.applicantName}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      r.type === 'travel' ? 'bg-sky-100 text-sky-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {r.type === 'travel' ? 'ไปราชการ' : r.type === 'sick' ? 'ลาป่วย' : r.type === 'personal' ? 'ลากิจ' : 'ขออนุญาต'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              {isAdmin ? 'สิทธิ์แอดมิน: สามารถเพิ่มรายการลาและแจ้งเตือนบุคลากรได้' : 'สิทธิ์แก้ไขข้อมูลเพิ่มเติมเข้าสู่หน้าแอดมิน'}
            </p>
          </div>
        </div>
      </div>

      {/* Admin Individual Notice Section */}
      {isAdmin && (
        <div className="bg-amber-50/80 p-5 rounded-2xl border border-amber-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-amber-600 animate-bounce" />
              <h4 className="font-bold text-sm text-amber-900">แจ้งเตือนครู/บุคลากรที่ไม่ลงเวลาปฏิบัติงานประจำวัน (ฟีเจอร์แอดมิน)</h4>
            </div>
            <span className="text-xs bg-amber-200 text-amber-900 font-bold px-2.5 py-0.5 rounded-full">
              ยังไม่ลงเวลา {unclockedUsers.length} คน
            </span>
          </div>
          <p className="text-xs text-amber-800">แอดมินสามารถส่งข้อความแจ้งเตือนตรงไปยังผู้ใช้งานรายบุคคลที่ยังไม่ได้ลงเวลาวันนี้</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pt-1">
            {unclockedUsers.length === 0 ? (
              <div className="col-span-full text-center py-3 text-xs text-emerald-700 font-semibold bg-emerald-50 rounded-xl border border-emerald-100">
                ✅ บุคลากรทุกคนลงเวลาหรือยื่นคำร้องลาเรียบร้อยแล้ว
              </div>
            ) : (
              unclockedUsers.map(u => (
                <div key={u.id} className="bg-white p-2.5 rounded-xl border border-amber-200 flex items-center justify-between text-xs shadow-xs">
                  <div>
                    <span className="font-bold text-gray-800 block">{u.name}</span>
                    <span className="text-[10px] text-gray-500">{u.position} ({u.group})</span>
                  </div>
                  <button
                    onClick={() => {
                      setNoticeTargetUser(u.name);
                      setShowNoticeModal(true);
                    }}
                    className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition"
                  >
                    <Send className="w-3 h-3" />
                    <span>แจ้งเตือน</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Saraban Order & Certificate Request Panels on Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Request Panel */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-purple-light space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-gray-800 flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-brand-purple" />
                <span>ทะเบียนเลขคำสั่งโรงเรียน (ขอเลขคำสั่ง)</span>
              </h3>
              <p className="text-xs text-gray-500">ยื่นขอเลขคำสั่งแต่งตั้งและติดตามตารางลำดับเลขคำสั่ง</p>
            </div>
            <button
              onClick={() => setShowEdocModal(true)}
              className="flex items-center space-x-1.5 bg-brand-purple hover:bg-brand-purple-dark text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ขอเลขคำสั่ง</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-purple-50 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-gray-600 font-semibold border-b border-purple-50">
                  <th className="p-2.5">เลขที่คำสั่ง</th>
                  <th className="p-2.5">เรื่องคำสั่งแต่งตั้ง</th>
                  <th className="p-2.5">คณะผู้เกี่ยวข้อง</th>
                  <th className="p-2.5">วันที่</th>
                  <th className="p-2.5 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50/50">
                {(!edocs || edocs.length === 0) ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-400">ยังไม่มีรายการขอเลขคำสั่งในระบบ</td>
                  </tr>
                ) : (
                  edocs.slice(0, 5).map((e, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-bold text-brand-purple-dark">{e.commandNo}</td>
                      <td className="p-2.5 font-medium text-gray-800 truncate max-w-xs">{e.title}</td>
                      <td className="p-2.5 text-gray-600 truncate max-w-xs">{e.travelNames?.join(', ') || '-'}</td>
                      <td className="p-2.5 text-gray-500">{e.dateStr}</td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          e.status === 'เรียบร้อย' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Certificate Request Panel */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-purple-light space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-gray-800 flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-600" />
                <span>ทะเบียนเลขเกียรติบัตร (ขอเลขเกียรติบัตร)</span>
              </h3>
              <p className="text-xs text-gray-500">ยื่นขอเลขเกียรติบัตรและตารางแสดงลำดับการจัดสรร</p>
            </div>
            <button
              onClick={() => setShowCertModal(true)}
              className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ขอเลขเกียรติบัตร</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-amber-100/50 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-amber-50/50 text-gray-600 font-semibold border-b border-amber-100/50">
                  <th className="p-2.5">รหัสจัดสรร</th>
                  <th className="p-2.5">ผู้ยื่นคำขอ</th>
                  <th className="p-2.5">หัวข้อโครงการ/กิจกรรม</th>
                  <th className="p-2.5 text-center">จำนวน (ใบ)</th>
                  <th className="p-2.5">วันที่</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50/50">
                {(!certs || certs.length === 0) ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-400">ยังไม่มีรายการขอเลขเกียรติบัตรในระบบ</td>
                  </tr>
                ) : (
                  certs.slice(0, 5).map((c, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/20">
                      <td className="p-2.5 font-bold text-amber-800">
                        {c.startNo ? `CERT-${String(c.startNo).padStart(3, '0')}-${String(c.startNo + c.certCount - 1).padStart(3, '0')}` : 'CERT-NEW'}
                      </td>
                      <td className="p-2.5 font-medium text-gray-800">{c.applicantName}</td>
                      <td className="p-2.5 text-gray-600 truncate max-w-xs">{c.topic}</td>
                      <td className="p-2.5 text-center font-bold text-amber-700">{c.certCount}</td>
                      <td className="p-2.5 text-gray-500">{c.requestDate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Central Booking Forms Panel & Calendar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-purple-light space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">ระบบจองยานพาหนะ & อาคารสถานที่</h3>
            <p className="text-xs text-gray-500">ยื่นจองรถหรืออาคารส่วนกลาง (สำหรับกรณีทั่วไปที่ไม่ได้จัดในคำร้องไปราชการ)</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              id="book-vehicle-btn"
              onClick={() => setShowVehicleModal(true)}
              className="flex items-center space-x-1.5 bg-brand-purple text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-brand-purple-dark transition shadow-sm"
            >
              <Car className="w-4 h-4" />
              <span>จองรถส่วนกลาง</span>
            </button>
            <button
              id="book-building-btn"
              onClick={() => setShowBuildingModal(true)}
              className="flex items-center space-x-1.5 bg-brand-blue text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-brand-blue-dark transition shadow-sm"
            >
              <Building2 className="w-4 h-4" />
              <span>ขอใช้อาคารสถานที่</span>
            </button>
          </div>
        </div>

        {/* Calendar and Bookings list inside dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div id="calendar-view-panel" className="lg:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-700">ปฏิทินจองรถยนต์</span>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs bg-white border border-gray-200 rounded px-2 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-purple"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="flex items-center space-x-1"><span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span><span className="text-gray-600 font-medium">รถตู้คันที่ 1</span></div>
              <div className="flex items-center space-x-1"><span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span><span className="text-gray-600 font-medium">รถตู้คันที่ 2</span></div>
              <div className="flex items-center space-x-1"><span className="w-2.5 h-2.5 bg-sky-500 rounded-full"></span><span className="text-gray-600 font-medium">รถหกล้อคันที่ 1</span></div>
              <div className="flex items-center space-x-1"><span className="w-2.5 h-2.5 bg-pink-500 rounded-full"></span><span className="text-gray-600 font-medium">รถหกล้อคันที่ 2</span></div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-gray-500">
              <div>อา</div><div>จ</div><div>อ</div><div>พ</div><div>พฤ</div><div>ศ</div><div>ส</div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {daysInMonth().map((date, index) => {
                const dateStr = date.toISOString().split('T')[0];
                const dateNum = date.getDate();
                const isSelected = dateStr === selectedDate;
                const dayBookings = allVehicleBookings.filter(b => b.rawDate === dateStr && b.status === 'อนุมัติ');

                return (
                  <div 
                    key={index} 
                    onClick={() => setSelectedDate(dateStr)}
                    className={`h-11 rounded-lg flex flex-col justify-between p-1 cursor-pointer transition relative border ${
                      isSelected ? 'border-brand-purple bg-purple-50' : 'border-transparent bg-white hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-[10px] font-medium text-gray-600 self-start">{dateNum}</span>
                    <div className="flex flex-wrap gap-0.5 justify-center">
                      {dayBookings.slice(0, 3).map((b, bIdx) => (
                        <span 
                          key={bIdx} 
                          className={`w-2 h-2 rounded-full ${
                            b.vehicle === 'รถตู้ 1' ? 'bg-red-500' :
                            b.vehicle === 'รถตู้ 2' ? 'bg-green-500' :
                            b.vehicle === 'รถหกล้อ 1' ? 'bg-sky-500' : 'bg-pink-500'
                          }`}
                          title={`${b.booker} | ${b.vehicle}`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div id="booking-table-panel" className="lg:col-span-7 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">รายการจองรถยนต์</h4>
            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-gray-500 border-b border-gray-100">
                    <th className="p-3">ลำดับ</th>
                    <th className="p-3">ผู้จอง</th>
                    <th className="p-3">วันที่จอง</th>
                    <th className="p-3">รถที่จอง</th>
                    <th className="p-3">พนักงานขับ</th>
                    <th className="p-3">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allVehicleBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-400">ยังไม่มีรายการจองรถยนต์ส่วนกลาง</td>
                    </tr>
                  ) : (
                    allVehicleBookings.slice(0, 5).map((b, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-gray-400">{b.no}</td>
                        <td className="p-3 font-medium text-gray-800">{b.booker}</td>
                        <td className="p-3 text-gray-600">{b.date}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getVehicleColorClass(b.vehicle)}`}>
                            {b.vehicle}
                          </span>
                        </td>
                        <td className="p-3 text-gray-500">{b.driver}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            b.status === 'อนุมัติ' ? 'bg-green-100 text-green-700' :
                            b.status === 'ไม่อนุมัติ' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {b.status}
                          </span>
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

      {/* Personal Leave Summary & Personal Track Requests */}
      {currentUser && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div id="personal-leave-summary-panel" className="bg-white p-6 rounded-2xl shadow-sm border border-brand-purple-light flex flex-col justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-800">สรุปวันลารายบุคคล</h3>
              <p className="text-xs text-gray-500 mb-4">{currentUser.name}</p>

              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-1">ช่วงเวลา</label>
                  <select 
                    value={leaveFilterPeriod}
                    onChange={(e) => setLeaveFilterPeriod(e.target.value as 'p1' | 'p2')}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-gray-700"
                  >
                    <option value="p1">1 ต.ค. - 31 มี.ค.</option>
                    <option value="p2">1 เม.ย. - 30 ก.ย.</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-1">ปี พ.ศ.</label>
                  <select
                    value={leaveFilterYear}
                    onChange={(e) => setLeaveFilterYear(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-gray-700"
                  >
                    <option value="2569">2569</option>
                    <option value="2568">2568</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-center">
                  <span className="block text-[10px] font-semibold text-red-400 uppercase">ลาป่วย</span>
                  <span className="text-2xl font-bold text-red-600">{myLeaveStats.sick}</span>
                  <span className="text-[10px] text-red-400 block">วัน</span>
                </div>
                <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-center">
                  <span className="block text-[10px] font-semibold text-purple-400 uppercase">ลากิจ</span>
                  <span className="text-2xl font-bold text-purple-600">{myLeaveStats.personal}</span>
                  <span className="text-[10px] text-purple-400 block">วัน</span>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-center">
                  <span className="block text-[10px] font-semibold text-amber-400 uppercase">สาย/ชี้แจง</span>
                  <span className="text-2xl font-bold text-amber-600">{myLeaveStats.late}</span>
                  <span className="text-[10px] text-amber-400 block">ครั้ง</span>
                </div>
                <div className="bg-sky-50 p-3 rounded-xl border border-sky-100 text-center">
                  <span className="block text-[10px] font-semibold text-sky-400 uppercase">ขออนุญาตออกนอก</span>
                  <span className="text-2xl font-bold text-sky-600">{myLeaveStats.permission}</span>
                  <span className="text-[10px] text-sky-400 block">ครั้ง</span>
                </div>
              </div>
            </div>
          </div>

          <div id="track-requests-panel" className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-brand-purple-light">
            <h3 className="text-base font-semibold text-gray-800 mb-1">ติดตามสถานะคำร้องของคุณ</h3>
            <p className="text-xs text-gray-500 mb-4">แสดงประวัติคำร้องล่าสุดและขั้นตอนลำดับการอนุมัติปัจจุบัน</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-gray-500 border-b border-gray-100">
                    <th className="p-3">ประเภทคำร้อง</th>
                    <th className="p-3">วันที่เริ่ม - สิ้นสุด</th>
                    <th className="p-3">เหตุผล / ภารกิจ</th>
                    <th className="p-3">ลำดับอนุมัติปัจจุบัน</th>
                    <th className="p-3">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {requests.filter(r => r.applicantName === currentUser.name).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-gray-400">คุณยังไม่เคยยื่นใบคำร้องผ่านระบบ</td>
                    </tr>
                  ) : (
                    requests.filter(r => r.applicantName === currentUser.name).slice(0, 5).map((r, idx) => {
                      const currentApproverStepInfo = r.approvalHistory.find(h => h.step === r.currentApprovalStep);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-gray-800 capitalize">
                            {r.type === 'travel' ? 'ไปราชการ' : r.type === 'sick' ? 'ลาป่วย' : r.type === 'personal' ? 'ลากิจ' : r.type === 'out_of_bounds' ? 'ขออนุญาตออกนอก' : 'ชี้แจงปฏิบัติงาน'}
                          </td>
                          <td className="p-3 text-gray-600">{r.dateStart} ถึง {r.dateEnd}</td>
                          <td className="p-3 text-gray-500 truncate max-w-xs">{r.reason}</td>
                          <td className="p-3 font-medium text-gray-700">
                            {currentApproverStepInfo ? `${currentApproverStepInfo.roleName} (ขั้นที่ ${r.currentApprovalStep})` : 'สิ้นสุดขั้นตอน'}
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              r.status === 'approved' ? 'bg-green-100 text-green-700' :
                              r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {r.status === 'approved' ? 'อนุมัติเรียบร้อย' :
                               r.status === 'rejected' ? 'ปฏิเสธ' : 'กำลังดำเนินการ'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Form Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl relative border border-brand-purple-light">
            <h3 className="text-lg font-bold text-gray-800 mb-1">แบบฟอร์มจองยานพาหนะส่วนกลาง</h3>
            <p className="text-xs text-gray-500 mb-4">กรณีทั่วไปที่ไม่เกี่ยวข้องกับการไปราชการ</p>
            <form onSubmit={handleVehicleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-600 font-semibold mb-1">ชื่อ-สกุลผู้จอง</label>
                <input type="text" value={vName} onChange={(e) => setVName(e.target.value)} required className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-brand-purple" />
              </div>
              <div>
                <label className="block text-gray-600 font-semibold mb-1">รายละเอียดการเดินทาง / ภารกิจ</label>
                <textarea value={vPurpose} onChange={(e) => setVPurpose(e.target.value)} required rows={2} className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-brand-purple"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">จำนวนผู้เดินทาง (คน)</label>
                  <input type="number" value={vPassengers} onChange={(e) => setVPassengers(parseInt(e.target.value))} min={1} required className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-brand-purple" />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">สถานที่ปลายทาง</label>
                  <input type="text" value={vDestination} onChange={(e) => setVDestination(e.target.value)} required className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-brand-purple" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">วันที่เดินทางไป</label>
                  <input type="date" value={vDateStart} onChange={(e) => setVDateStart(e.target.value)} required className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-brand-purple" />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">วันที่เดินทางกลับ</label>
                  <input type="date" value={vDateEnd} onChange={(e) => setVDateEnd(e.target.value)} required className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-brand-purple" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">เวลาเดินทางไป</label>
                  <input type="time" value={vTimeStart} onChange={(e) => setVTimeStart(e.target.value)} required className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-brand-purple" />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">เวลาเดินทางกลับ</label>
                  <input type="time" value={vTimeEnd} onChange={(e) => setVTimeEnd(e.target.value)} required className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-brand-purple" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">รถที่ต้องการจอง</label>
                  <select value={vType} onChange={(e) => setVType(e.target.value)} className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-brand-purple">
                    <option value="รถตู้ 1">รถตู้ 1</option>
                    <option value="รถตู้ 2">รถตู้ 2</option>
                    <option value="รถหกล้อ 1">รถหกล้อ 1</option>
                    <option value="รถหกล้อ 2">รถหกล้อ 2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">ระบุพนักงานขับรถ (ถ้ามี)</label>
                  <input type="text" value={vDriver} onChange={(e) => setVDriver(e.target.value)} placeholder="ใส่ชื่อคนขับ" className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-brand-purple" />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowVehicleModal(false)} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg font-semibold text-gray-600 transition">ยกเลิก</button>
                <button type="submit" className="bg-brand-purple hover:bg-brand-purple-dark text-white px-4 py-2 rounded-lg font-semibold transition">บันทึกจองรถ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Building Form Modal (Free-text Building Name Input) */}
      {showBuildingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl relative border border-brand-blue-light">
            <h3 className="text-lg font-bold text-gray-800 mb-1">ยื่นใบคำร้องขอใช้อาคารสถานที่</h3>
            <p className="text-xs text-gray-500 mb-4">
              อนุมัติโดย: หัวหน้างานทั่วไป ➔ ผู้ช่วยฯ บริหารทั่วไป ➔ รองฯ บริหารทั่วไป ➔ ผู้อำนวยการโรงเรียน
            </p>
            <form onSubmit={handleBuildingSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-600 font-semibold mb-1">ชื่อ-สกุลผู้จอง</label>
                <input type="text" value={bName} onChange={(e) => setBName(e.target.value)} required className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-brand-blue" />
              </div>
              <div>
                <label className="block text-gray-600 font-semibold mb-1">อาคารสถานที่ต้องการใช้ (ระบุเอง)</label>
                <input 
                  type="text" 
                  value={bBuilding} 
                  onChange={(e) => setBBuilding(e.target.value)} 
                  placeholder="เช่น หอประชุมใหญ่, ห้องประชุมราชพฤกษ์, สนามฟุตบอล..." 
                  required 
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-brand-blue" 
                />
              </div>
              <div>
                <label className="block text-gray-600 font-semibold mb-1">รายละเอียดภารกิจ / ประชุมเรื่อง</label>
                <textarea value={bPurpose} onChange={(e) => setBPurpose(e.target.value)} required rows={2} className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-brand-blue"></textarea>
              </div>
              <div>
                <label className="block text-gray-600 font-semibold mb-1">วันที่ขอใช้อาคาร</label>
                <input type="date" value={bDate} onChange={(e) => setBDate(e.target.value)} required className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-brand-blue" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">เวลาเริ่มต้น</label>
                  <input type="time" value={bTimeStart} onChange={(e) => setBTimeStart(e.target.value)} required className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-brand-blue" />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">เวลาสิ้นสุด</label>
                  <input type="time" value={bTimeEnd} onChange={(e) => setBTimeEnd(e.target.value)} required className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-brand-blue" />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowBuildingModal(false)} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg font-semibold text-gray-600 transition">ยกเลิก</button>
                <button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark text-white px-4 py-2 rounded-lg font-semibold transition">ส่งคำขอใช้อาคาร</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Add Absent Personnel Modal */}
      {showAddAbsentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl relative border border-brand-purple-light text-xs space-y-4">
            <h3 className="text-base font-bold text-gray-800 flex items-center space-x-2">
              <UserPlus className="w-5 h-5 text-brand-purple" />
              <span>แอดมินบันทึกข้อมูลบุคลากรลา/ราชการวันนี้</span>
            </h3>
            <form onSubmit={handleAbsentSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">เลือกบุคลากร</label>
                <select
                  value={absentUser}
                  onChange={(e) => setAbsentUser(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 font-medium"
                >
                  <option value="">-- กรุณาเลือกบุคลากร --</option>
                  {(users || [])
                    .filter(u => !u.position.includes('แอดมิน') && !u.position.includes('ผู้ดูแลระบบ'))
                    .map(u => (
                      <option key={u.id} value={u.name}>{u.name} - {u.position} ({u.group})</option>
                    ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">ประเภทการลา / ราชการ</label>
                  <select
                    value={absentType}
                    onChange={(e) => setAbsentType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 font-medium"
                  >
                    <option value="travel">ไปราชการ</option>
                    <option value="sick">ลาป่วย</option>
                    <option value="personal">ลากิจ</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">วันที่</label>
                  <input
                    type="date"
                    value={absentDate}
                    onChange={(e) => setAbsentDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">รายละเอียด / เหตุผลภารกิจ</label>
                <textarea
                  value={absentReason}
                  onChange={(e) => setAbsentReason(e.target.value)}
                  placeholder="ระบุเหตุผลหรือภารกิจการลา/ไปราชการ..."
                  rows={2}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowAddAbsentModal(false)} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg font-semibold text-gray-600 transition">ยกเลิก</button>
                <button type="submit" className="bg-brand-purple hover:bg-brand-purple-dark text-white px-4 py-2 rounded-lg font-semibold transition">บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Send Individual Notice Modal */}
      {showNoticeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl relative border border-amber-300 text-xs space-y-4">
            <h3 className="text-base font-bold text-gray-800 flex items-center space-x-2">
              <Bell className="w-5 h-5 text-amber-600" />
              <span>ส่งข้อความแจ้งเตือนผู้ใช้งานรายบุคคล</span>
            </h3>
            <form onSubmit={handleNoticeSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">ผู้รับการแจ้งเตือน</label>
                <input type="text" value={noticeTargetUser} readOnly className="w-full bg-slate-100 border border-gray-200 rounded-lg p-2 font-bold text-gray-800" />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">ข้อความแจ้งเตือน</label>
                <textarea
                  value={noticeMessage}
                  onChange={(e) => setNoticeMessage(e.target.value)}
                  rows={3}
                  required
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 font-medium"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowNoticeModal(false)} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg font-semibold text-gray-600 transition">ยกเลิก</button>
                <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center space-x-1">
                  <Send className="w-3.5 h-3.5" />
                  <span>ส่งการแจ้งเตือน</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Order Modal */}
      {showEdocModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl relative border border-brand-purple-light text-xs space-y-4">
            <h3 className="text-base font-bold text-gray-800 flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-brand-purple" />
              <span>ยื่นขอออกเลขคำสั่งโรงเรียน</span>
            </h3>
            <form onSubmit={handleEdocSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">ชื่อเรื่องคำสั่งแต่งตั้ง</label>
                <input
                  type="text"
                  value={edocTitle}
                  onChange={(e) => setEdocTitle(e.target.value)}
                  placeholder="เช่น แต่งตั้งคณะกรรมการดำเนินงานกิจกรรม..."
                  required
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">คณะผู้เดินทาง / ผู้เกี่ยวข้อง (ใส่จุลภาค , คั่น)</label>
                <input
                  type="text"
                  value={edocTravelers}
                  onChange={(e) => setEdocTravelers(e.target.value)}
                  placeholder="นายสมชาย, นางสาวสมหญิง..."
                  required
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">วันที่</label>
                  <input
                    type="date"
                    value={edocDate}
                    onChange={(e) => setEdocDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">สถานที่ดำเนินงาน</label>
                  <input
                    type="text"
                    value={edocLocation}
                    onChange={(e) => setEdocLocation(e.target.value)}
                    placeholder="เช่น โรงเรียนชุมพวงศึกษา"
                    required
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">หน่วยงาน / กลุ่มสาระฯ</label>
                <input
                  type="text"
                  value={edocGroup}
                  onChange={(e) => setEdocGroup(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowEdocModal(false)} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg font-semibold text-gray-600 transition">ยกเลิก</button>
                <button type="submit" className="bg-brand-purple hover:bg-brand-purple-dark text-white px-4 py-2 rounded-lg font-semibold transition">ขอออกเลขคำสั่ง</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Certificate Modal */}
      {showCertModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl relative border border-amber-300 text-xs space-y-4">
            <h3 className="text-base font-bold text-gray-800 flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-600" />
              <span>ยื่นขอรหัส/เลขเกียรติบัตรโรงเรียน</span>
            </h3>
            <form onSubmit={handleCertSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">ผู้ยื่นคำขอ</label>
                <input
                  type="text"
                  value={certApplicant}
                  onChange={(e) => setCertApplicant(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">หัวข้อโครงการ / กิจกรรมจัดมอบเกียรติบัตร</label>
                <textarea
                  value={certTopic}
                  onChange={(e) => setCertTopic(e.target.value)}
                  placeholder="เช่น การแข่งขันทักษะวิชาการเนื่องในวันครู..."
                  rows={2}
                  required
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">วันที่ยื่นขอ</label>
                  <input
                    type="date"
                    value={certDate}
                    onChange={(e) => setCertDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">จำนวนเกียรติบัตร (ใบ)</label>
                  <input
                    type="number"
                    min={1}
                    value={certCount}
                    onChange={(e) => setCertCount(parseInt(e.target.value) || 1)}
                    required
                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2 font-bold text-amber-700"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowCertModal(false)} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg font-semibold text-gray-600 transition">ยกเลิก</button>
                <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-semibold transition">ยื่นขอเลขเกียรติบัตร</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Historical Stats Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl relative border border-brand-purple-light text-xs space-y-4">
            <h3 className="text-base font-bold text-gray-800">สถิติการมาปฏิบัติงานย้อนหลัง</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-gray-500 font-semibold mb-1">เลือกปี พ.ศ.</label>
                <select value={historyYear} onChange={(e) => setHistoryYear(e.target.value)} className="w-full bg-slate-50 border border-gray-200 rounded-lg p-2">
                  <option value="2569">2569</option>
                  <option value="2568">2568</option>
                </select>
              </div>
            </div>

            <div className="border border-slate-100 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="bg-slate-50 text-gray-500 border-b border-slate-100 sticky top-0">
                  <tr>
                    <th className="p-3">วันที่</th>
                    <th className="p-3">กลุ่มสาระ / ฝ่าย</th>
                    <th className="p-3 text-center">มาเรียน/ปฏิบัติงาน (คน)</th>
                    <th className="p-3 text-center">ขาด/ลา/ราชการ (คน)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dailyStats.map((stat, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 text-gray-600">{stat.date}</td>
                      <td className="p-3 font-medium text-gray-800">{stat.group}</td>
                      <td className="p-3 text-center font-bold text-brand-purple">{stat.presentCount}</td>
                      <td className="p-3 text-center font-bold text-red-500">{stat.absentCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setShowHistoryModal(false)} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg font-semibold text-gray-600 transition">ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
