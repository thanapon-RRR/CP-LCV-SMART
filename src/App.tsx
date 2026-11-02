import React, { useState, useEffect, useRef } from 'react';
import { User, RequestItem, DailyStat, ApproverRole, LeaveBalance, VehicleBooking, BuildingBooking, EdocOrder, CertificateRequest } from './types';
import {
  INITIAL_USERS,
  INITIAL_REQUESTS,
  INITIAL_DAILY_STATS,
  INITIAL_APPROVER_ROLES,
  INITIAL_LEAVE_BALANCES,
  INITIAL_VEHICLE_BOOKINGS,
  INITIAL_BUILDING_BOOKINGS,
  INITIAL_EDOCS,
  INITIAL_CERT_REQUESTS
} from './data';
import { initAuth, googleSignIn, logout, getAccessToken } from './lib/auth';
import { findDatabaseFile, createDatabaseFile, fetchAllTables, saveTableToSheet } from './lib/sheets';

// Components
import Dashboard from './components/Dashboard';
import LeaveForm from './components/LeaveForm';
import TravelForm from './components/TravelForm';
import TeachingManagement from './components/TeachingManagement';
import VehicleManagement from './components/VehicleManagement';
import ApprovalDashboard from './components/ApprovalDashboard';
import Saraban from './components/Saraban';
import ReportDashboard from './components/ReportDashboard';
import AdminHub from './components/AdminHub';
import LoginScreen from './components/LoginScreen';
import ToastContainer, { ToastNotification } from './components/ToastContainer';

import {
  Shield, LogIn, LogOut, LayoutDashboard, FileText, FileSpreadsheet, BookOpen,
  Car, UserCheck, ShieldAlert, FilePlus2, BarChart3, Database, Sparkles, RefreshCw, Mail, Bell, Type
} from 'lucide-react';

export default function App() {
  // Font Size Accessibility State
  const [fontSizeLevel, setFontSizeLevel] = useState<'normal' | 'large' | 'xlarge'>(() => {
    return (localStorage.getItem('cp_lcv_font_size') as 'normal' | 'large' | 'xlarge') || 'large';
  });

  useEffect(() => {
    document.documentElement.classList.remove('font-size-normal', 'font-size-large', 'font-size-xlarge');
    document.documentElement.classList.add(`font-size-${fontSizeLevel}`);
    localStorage.setItem('cp_lcv_font_size', fontSizeLevel);
  }, [fontSizeLevel]);

  // Auth state
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Active Tab with URL search param support
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['dashboard', 'leave', 'travel', 'teaching', 'vehicle', 'approval', 'saraban', 'reports', 'admin'].includes(tabParam)) {
        return tabParam;
      }
    }
    return 'dashboard';
  });

  // Sync activeTab with URL query parameters for direct link sharing & bookmarking
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.get('tab') !== activeTab) {
          url.searchParams.set('tab', activeTab);
          window.history.replaceState({}, '', url.toString());
        }
      } catch {
        // Ignore iframe URL manipulation errors if any
      }
    }
  }, [activeTab]);

  // Master Databases states
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('cp_lcv_logged_in') === 'true';
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cp_lcv_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [requests, setRequests] = useState<RequestItem[]>(INITIAL_REQUESTS);
  const [approverRoles, setApproverRoles] = useState<ApproverRole[]>(INITIAL_APPROVER_ROLES);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>(INITIAL_LEAVE_BALANCES);
  const [vehicleBookings, setVehicleBookings] = useState<VehicleBooking[]>(INITIAL_VEHICLE_BOOKINGS);
  const [buildingBookings, setBuildingBookings] = useState<BuildingBooking[]>(INITIAL_BUILDING_BOOKINGS);
  const [edocs, setEdocs] = useState<EdocOrder[]>(INITIAL_EDOCS);
  const [certs, setCerts] = useState<CertificateRequest[]>(INITIAL_CERT_REQUESTS);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>(INITIAL_DAILY_STATS);

  // --- Notifications, Email Logs and Toast states ---
  const [notifications, setNotifications] = useState<{
    id: string;
    userId: string;
    text: string;
    type: 'info' | 'success' | 'alert';
    createdAt: string;
    read: boolean;
  }[]>(() => {
    const saved = localStorage.getItem('cp_lcv_notifications');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'notif-1',
        userId: 'ครูวิทยา สอนดี',
        text: '🎉 คำร้อง "พานักเรียนเข้าร่วมการแข่งขันหุ่นยนต์ระดับภาค" ของคุณได้รับการอนุมัติเสร็จสมบูรณ์เรียบร้อยแล้วโดย ผู้อำนวยการโรงเรียน!',
        type: 'success',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        read: false
      },
      {
        id: 'notif-2',
        userId: 'ครูสมศรี ศิลป์สวย',
        text: 'คำร้อง "ลาป่วย" ของคุณได้รับการส่งต่อไปยัง ผู้ช่วยฯ ฝ่ายบุคคล เพื่ออนุมัติในลำดับถัดไป',
        type: 'info',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        read: false
      }
    ];
  });

  const [emailLogs, setEmailLogs] = useState<{
    id: string;
    recipientName: string;
    recipientEmail: string;
    subject: string;
    body: string;
    sentAt: string;
  }[]>(() => {
    const saved = localStorage.getItem('cp_lcv_email_logs');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'email-1',
        recipientName: 'นายสมชาย ดีเลิศ',
        recipientEmail: 'somchai@cp.ac.th',
        subject: '[CP-LCV] มีใบคำร้องขอไปราชการรอการพิจารณาจากคุณ: ครูวิทยา สอนดี',
        body: 'เรียน นายสมชาย ดีเลิศ,\n\nมีคำร้องประเภท ไปราชการ เรื่อง: "พานักเรียนเข้าร่วมการแข่งขันหุ่นยนต์ระดับภาค" เสนอมาโดย ครูวิทยา สอนดี รอการตรวจพิจารณาและอนุมัติขั้นสุดท้ายในระบบดิจิทัล CP-LCV SMART\n\nโปรดเข้าสู่ระบบเพื่อดำเนินการพิจารณา',
        sentAt: new Date(Date.now() - 3600000 * 3).toISOString()
      }
    ];
  });

  // Real-time Pop-up Toast notifications state
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const prevRequestsRef = useRef<Map<string, { status: string; step: number }> | null>(null);

  // Play subtle pleasant chime audio when toast notification triggers
  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  // Real-time Pop-up (Toast) reactive listener: detects changes to `status` in `requests` state
  useEffect(() => {
    if (prevRequestsRef.current === null) {
      // Initialize on first mount without popping false toasts
      const initialMap = new Map<string, { status: string; step: number }>();
      requests.forEach(r => {
        initialMap.set(r.id, { status: r.status, step: r.currentApprovalStep });
      });
      prevRequestsRef.current = initialMap;
      return;
    }

    const prevMap = prevRequestsRef.current;
    const newToasts: ToastNotification[] = [];

    requests.forEach(req => {
      const prev = prevMap.get(req.id);
      if (prev) {
        // Detect status change
        if (prev.status !== req.status) {
          if (req.status === 'approved') {
            newToasts.push({
              id: `toast-${Date.now()}-${req.id}-approved`,
              requestId: req.id,
              type: 'approved',
              title: 'คำร้องได้รับการอนุมัติเสร็จสิ้น! 🎉',
              applicantName: req.applicantName,
              reason: req.reason,
              message: `คำร้อง "${req.reason}" ของ ${req.applicantName} ได้รับการอนุมัติเสร็จสมบูรณ์เรียบร้อยแล้ว`,
              timestamp: new Date().toLocaleTimeString('th-TH') + ' น.',
              stepInfo: 'อนุมัติครบทุกขั้นตอน'
            });
          } else if (req.status === 'rejected') {
            newToasts.push({
              id: `toast-${Date.now()}-${req.id}-rejected`,
              requestId: req.id,
              type: 'rejected',
              title: 'คำร้องไม่ผ่านการอนุมัติ ❌',
              applicantName: req.applicantName,
              reason: req.reason,
              message: `คำร้อง "${req.reason}" ของ ${req.applicantName} ไม่ได้รับการอนุมัติในระบบ`,
              timestamp: new Date().toLocaleTimeString('th-TH') + ' น.',
              stepInfo: 'สถานะ: ไม่อนุมัติ / ปฏิเสธ'
            });
          }
        } else if (req.status === 'pending' && prev.step !== req.currentApprovalStep && req.currentApprovalStep > prev.step) {
          // Detect step progression
          newToasts.push({
            id: `toast-${Date.now()}-${req.id}-step-${req.currentApprovalStep}`,
            requestId: req.id,
            type: 'progress',
            title: 'ความคืบหน้าการอนุมัติคำร้อง 📋',
            applicantName: req.applicantName,
            reason: req.reason,
            message: `คำร้อง "${req.reason}" ผ่านการพิจารณาขั้นที่ ${prev.step} เรียบร้อยแล้ว`,
            timestamp: new Date().toLocaleTimeString('th-TH') + ' น.',
            stepInfo: `เข้าสู่ขั้นตอนที่ ${req.currentApprovalStep} จาก ${req.approvalHistory.length}`
          });
        }
      }
    });

    // Update map to current requests state
    const currentMap = new Map<string, { status: string; step: number }>();
    requests.forEach(r => {
      currentMap.set(r.id, { status: r.status, step: r.currentApprovalStep });
    });
    prevRequestsRef.current = currentMap;

    if (newToasts.length > 0) {
      setToasts(prev => [...newToasts, ...prev].slice(0, 5));
      playNotificationSound();
    }
  }, [requests]);

  const handleDismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleNavigateToRequest = (requestId?: string) => {
    setActiveTab('dashboard');
  };

  // Helper function to test/simulate toast notification anytime
  const handleTestToast = (type: 'approved' | 'rejected' = 'approved') => {
    const testToast: ToastNotification = {
      id: `toast-test-${Date.now()}`,
      type,
      title: type === 'approved' ? 'ทดสอบ: คำร้องได้รับการอนุมัติ! 🎉' : 'ทดสอบ: คำร้องไม่ผ่านการอนุมัติ ❌',
      applicantName: currentUser?.name || 'ครูวิทยา สอนดี',
      reason: 'ขออนุญาตเดินทางไปราชการเข้าร่วมการแข่งขัน',
      message: type === 'approved'
        ? `คำร้องของ "${currentUser?.name || 'ครูวิทยา สอนดี'}" ได้รับการอนุมัติเสร็จสมบูรณ์เรียบร้อยแล้วโดย ผู้อำนวยการโรงเรียน`
        : `คำร้องของ "${currentUser?.name || 'ครูวิทยา สอนดี'}" ไม่ผ่านการอนุมัติ กรุณาตรวจสอบข้อมูล`,
      timestamp: new Date().toLocaleTimeString('th-TH') + ' น.',
      stepInfo: type === 'approved' ? 'อนุมัติครบ 5/5 ขั้นตอน' : 'สถานะ: ไม่อนุมัติ'
    };
    setToasts(prev => [testToast, ...prev].slice(0, 5));
    playNotificationSound();
  };

  useEffect(() => {
    localStorage.setItem('cp_lcv_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('cp_lcv_email_logs', JSON.stringify(emailLogs));
  }, [emailLogs]);

  const addNotification = (userId: string, text: string, type: 'info' | 'success' | 'alert') => {
    const newNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId,
      text,
      type,
      createdAt: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const getApproverEmail = (name: string): string => {
    const u = users.find(user => user.name === name);
    if (u?.email) return u.email;
    const alias = name.includes('สมชาย') ? 'somchai' :
                  name.includes('วิภา') ? 'wipa' :
                  name.includes('เกียรติ') ? 'kiat' :
                  name.includes('ประสิทธิ์') ? 'prasit' :
                  name.includes('นงนุช') ? 'nongnuch' :
                  name.includes('วิทยา') ? 'wittaya' :
                  name.includes('สมศรี') ? 'somsri' :
                  name.includes('คณิต') ? 'khanit' : 'approver';
    return `${alias}@cp.ac.th`;
  };

  const sendSimulatedEmail = (recipientName: string, recipientEmail: string, subject: string, body: string) => {
    const newLog = {
      id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      recipientName,
      recipientEmail: recipientEmail || `${recipientName.replace(/\s+/g, '')}@cp.ac.th`,
      subject,
      body,
      sentAt: new Date().toISOString()
    };
    setEmailLogs(prev => [newLog, ...prev]);
    setToasts(prev => [
      {
        id: `toast-email-${Date.now()}`,
        type: 'info',
        title: '📧 ส่งอีเมลระบบอัตโนมัติสำเร็จ',
        applicantName: recipientName,
        reason: subject,
        message: `ส่งอีเมลแจ้งเตือนไปยัง: ${newLog.recipientEmail}`,
        timestamp: new Date().toLocaleTimeString('th-TH') + ' น.'
      },
      ...prev
    ].slice(0, 5));
  };

  // Spreadsheet state
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // 1. Google Sheets Initializer
  useEffect(() => {
    initAuth(
      async (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
        setNeedsAuth(false);
        await initSpreadsheet(token, user.email || '');
      },
      () => {
        setNeedsAuth(true);
      }
    );
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setGoogleError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setAccessToken(result.accessToken);
        setNeedsAuth(false);
        setGoogleError(null);
        await initSpreadsheet(result.accessToken, result.user.email || '');
      }
    } catch (err: any) {
      console.error('OAuth Login failed:', err);
      if (err?.code === 'auth/popup-closed-by-user' || err?.message?.includes('popup-closed-by-user')) {
        setGoogleError('หน้าต่างเข้าสู่ระบบถูกปิดโดยผู้ใช้ หรือเบราว์เซอร์บล็อกป๊อปอัพ กรุณาเปิดสิทธิ์ให้ป๊อปอัพและลองใหม่อีกครั้ง');
      } else {
        setGoogleError(`ไม่สามารถเข้าสู่ระบบ Google: ${err?.message || err}`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setGoogleUser(null);
    setAccessToken(null);
    setSpreadsheetId(null);
    setNeedsAuth(true);
    setCurrentUser(null);
    setIsUserLoggedIn(false);
    localStorage.removeItem('cp_lcv_logged_in');
    localStorage.removeItem('cp_lcv_current_user');
  };

  // Locate or create the database file on Google Sheets
  const initSpreadsheet = async (token: string, userEmail: string) => {
    setIsSyncing(true);
    setSyncMessage('กำลังตรวจสอบไฟล์ฐานข้อมูลบน Google Drive ของคุณ...');
    try {
      let sheetId = await findDatabaseFile(token);
      if (!sheetId) {
        setSyncMessage('ไม่พบไฟล์ฐานข้อมูล! กำลังสร้างไฟล์ฐานข้อมูล "CP-LCV_SMART_Database" และนำเข้าข้อมูลเริ่มต้น...');
        sheetId = await createDatabaseFile(token);
        setSyncMessage('สร้างไฟล์ฐานข้อมูลโรงเรียนสำเร็จเรียบร้อยบน Google Drive!');
      } else {
        setSyncMessage('เชื่อมต่อไฟล์ฐานข้อมูลสำเร็จ! กำลังดึงข้อมูลล่าสุด...');
      }

      setSpreadsheetId(sheetId);
      
      // Fetch data from spreadsheet
      const fetched = await fetchAllTables(token, sheetId);
      if (fetched) {
        if (fetched.users && fetched.users.length > 0) setUsers(fetched.users);
        if (fetched.requests && fetched.requests.length > 0) setRequests(fetched.requests);
        if (fetched.approverRoles && fetched.approverRoles.length > 0) setApproverRoles(fetched.approverRoles);
        if (fetched.leaveBalances && fetched.leaveBalances.length > 0) setLeaveBalances(fetched.leaveBalances);
        if (fetched.vehicles && fetched.vehicles.length > 0) setVehicleBookings(fetched.vehicles);
        if (fetched.buildings && fetched.buildings.length > 0) setBuildingBookings(fetched.buildings);
        if (fetched.edocs && fetched.edocs.length > 0) setEdocs(fetched.edocs);
        if (fetched.certs && fetched.certs.length > 0) setCerts(fetched.certs);
      }

      // Sync existing logged-in user with updated sheet data if applicable
      const storedUser = localStorage.getItem('cp_lcv_current_user');
      if (storedUser) {
        try {
          const parsedStored = JSON.parse(storedUser);
          const fresh = (fetched?.users || users).find(u => u.id === parsedStored.id || u.name === parsedStored.name);
          if (fresh) {
            setCurrentUser(fresh);
            localStorage.setItem('cp_lcv_current_user', JSON.stringify(fresh));
          }
        } catch (e) {
          console.warn('Error syncing current user', e);
        }
      }

      setSyncMessage('เชื่อมโยงสารสนเทศเรียบร้อยพร้อมใช้งาน!');
    } catch (err) {
      console.error('Error initializing spreadsheet database:', err);
      setSyncMessage('กำลังใช้งานระบบในโหมด Local Cache (ออฟไลน์)');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(''), 4000);
    }
  };

  // Helper to sync a specific table back to Google Sheet
  const syncTable = async (tableName: string, headers: string[], rows: any[][]) => {
    if (!accessToken || !spreadsheetId) return;
    setIsSyncing(true);
    try {
      await saveTableToSheet(accessToken, spreadsheetId, tableName, headers, rows);
    } catch (err) {
      console.error(`Sync error on ${tableName}:`, err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Quick sync of everything to spreadsheet
  const triggerManualSync = async () => {
    if (!accessToken || !spreadsheetId) {
      alert('คุณต้องเข้าสู่ระบบ Google เพื่อเปิดใช้สิทธิ์เขียนไฟล์ Drive');
      return;
    }
    setIsSyncing(true);
    setSyncMessage('กำลังจัดส่งอัปเดตตารางทั้งหมดไปยัง Google Drive...');
    try {
      // Users
      await syncTable('Users', ['ID', 'Name', 'PIN', 'Position', 'Group', 'Tel', 'Email', 'CreatedAt'], users.map(u => [u.id, u.name, u.pin, u.position, u.group, u.tel, u.email, u.createdAt]));
      // Requests
      await syncTable('Requests', [
        'ID', 'Type', 'ApplicantName', 'ApplicantTel', 'ApplicantPosition', 'ApplicantGroup',
        'Reason', 'DateStart', 'DateEnd', 'TimeStart', 'TimeEnd', 'ContactAddress',
        'SubstitutionsJSON', 'Status', 'CurrentApprovalStep', 'ApprovalHistoryJSON',
        'AttachmentUrl', 'AttachmentName', 'CreatedAt', 'CompanionsJSON', 'VehicleType',
        'VehiclePlate', 'GoDistance', 'ReturnDistance', 'TotalDistance', 'TotalCompensation',
        'DriverName', 'BudgetSource', 'ClaimAllowance', 'ClaimFuel', 'ClaimOther', 'IsVehicleOnly'
      ], requests.map(r => [
        r.id, r.type, r.applicantName, r.applicantTel, r.applicantPosition, r.applicantGroup,
        r.reason, r.dateStart, r.dateEnd, r.timeStart, r.timeEnd, r.contactAddress,
        JSON.stringify(r.substitutions || []), r.status, r.currentApprovalStep, JSON.stringify(r.approvalHistory || []),
        r.attachmentUrl || '', r.attachmentName || '', r.createdAt, JSON.stringify(r.companions || []),
        r.vehicleType || '', r.vehiclePlate || '', r.goDistance || 0, r.returnDistance || 0, r.totalDistance || 0,
        r.totalCompensation || 0, r.driverName || '', r.budgetSource || '', r.claimAllowance ? 'TRUE' : 'FALSE',
        r.claimFuel ? 'TRUE' : 'FALSE', r.claimOther ? 'TRUE' : 'FALSE', r.isVehicleOnly ? 'TRUE' : 'FALSE'
      ]));
      // Vehicles
      await syncTable('Vehicles', ['ID', 'RequestID', 'ApplicantName', 'Purpose', 'PassengerCount', 'Destination', 'DateStart', 'DateEnd', 'TimeStart', 'TimeEnd', 'VehicleType', 'DriverName', 'Status'], vehicleBookings.map(v => [v.id, v.requestId || '', v.applicantName, v.purpose, v.passengerCount, v.destination, v.dateStart, v.dateEnd, v.timeStart, v.timeEnd, v.vehicleType, v.driverName, v.status]));
      // Buildings
      await syncTable('Buildings', ['ID', 'ApplicantName', 'BuildingName', 'Purpose', 'DateStart', 'TimeStart', 'TimeEnd', 'Status'], buildingBookings.map(b => [b.id, b.applicantName, b.buildingName, b.purpose, b.dateStart, b.timeStart, b.timeEnd, b.status]));
      // Edoc
      await syncTable('Edoc', ['ID', 'RequestID', 'CommandNo', 'Title', 'TravelNamesJSON', 'DateStr', 'Location', 'GroupNotes', 'Status'], edocs.map(e => [e.id, e.requestId, e.commandNo, e.title, JSON.stringify(e.travelNames), e.dateStr, e.location, e.groupNotes, e.status]));
      // Certificates
      await syncTable('Certificates', ['ID', 'ApplicantName', 'RequestDate', 'Topic', 'CertCount', 'StartNo'], certs.map(c => [c.id, c.applicantName, c.requestDate, c.topic, c.certCount, c.startNo]));
      
      setSyncMessage('ซิงค์ข้อมูลกับ Google Drive ประสบความสำเร็จ 100%!');
    } catch (err) {
      console.error('Manual sync failed:', err);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(''), 3000);
    }
  };

  // Reset entire state to default seed
  const handleResetAllData = () => {
    setUsers(INITIAL_USERS);
    setRequests(INITIAL_REQUESTS);
    setApproverRoles(INITIAL_APPROVER_ROLES);
    setLeaveBalances(INITIAL_LEAVE_BALANCES);
    setVehicleBookings(INITIAL_VEHICLE_BOOKINGS);
    setBuildingBookings(INITIAL_BUILDING_BOOKINGS);
    setEdocs(INITIAL_EDOCS);
    setCerts(INITIAL_CERT_REQUESTS);
    alert('รีเซ็ตข้อมูลเริ่มต้นระบบโรงเรียนสำเร็จ!');
  };

  // 2. Submit new Request logic
  const buildWorkflowSteps = (type: string, pos: string, grp: string) => {
    let steps: { step: number; roleName: string; approverName: string; status: 'pending' | 'approved' | 'rejected'; comment: string }[] = [];
    
    const getDeptHeadName = (g: string) => {
      if (g.includes('คณิตศาสตร์')) return 'ครูคณิต คิดเร็ว';
      if (g.includes('ศิลปะ')) return 'ครูสมศรี ศิลป์สวย';
      if (g.includes('วิทยาศาสตร์') || g.includes('เทคโนโลยี')) return 'ครูวิทยา สอนดี';
      const sameGrp = users.find(u => u.group === g && u.position === 'ครู');
      return sameGrp?.name || 'ครูวิทยา สอนดี';
    };

    const getAdminDeptHeadName = (g: string) => {
      if (g.includes('แผนงาน') || g.includes('งบประมาณ')) return 'นางสาวนงนุช แผนดี';
      if (g.includes('บุคคล')) return 'นายเกียรติศักดิ์ พลบุตร';
      return 'นายประสิทธิ์ การดี';
    };

    if (type === 'travel') {
      // Travel request workflow (Reverse 5 -> 1)
      steps = [
        { step: 1, roleName: 'หัวหน้ากลุ่มสาระการเรียนรู้ที่สังกัด', approverName: getDeptHeadName(grp), status: 'pending', comment: '' },
        { step: 2, roleName: 'หัวหน้ากลุ่มงานบุคคล', approverName: 'นายเกียรติศักดิ์ พลบุตร', status: 'pending', comment: '' },
        { step: 3, roleName: 'ผู้ช่วยฯ ฝ่ายบุคคล', approverName: 'นายเกียรติศักดิ์ พลบุตร', status: 'pending', comment: '' },
        { step: 4, roleName: 'รองฯ ฝ่ายบุคคล', approverName: 'นายเกียรติศักดิ์ พลบุตร', status: 'pending', comment: '' },
        { step: 5, roleName: 'ผู้อำนวยการโรงเรียน', approverName: 'นายสมชาย ดีเลิศ', status: 'pending', comment: '' }
      ];
    } else {
      // Leave requests workflows
      if (pos.includes('รองผู้อำนวยการ') || pos.includes('รองฯ')) {
        // [กรณีลา/ขออนุญาต ของ รองผู้อำนวยการ] เป็นแบบ reverse 4 ->1
        steps = [
          { step: 1, roleName: 'หัวหน้ากลุ่มงานบุคคล', approverName: 'นายเกียรติศักดิ์ พลบุตร', status: 'pending', comment: '' },
          { step: 2, roleName: 'ผู้ช่วยฯ ฝ่ายบุคคล', approverName: 'นายเกียรติศักดิ์ พลบุตร', status: 'pending', comment: '' },
          { step: 3, roleName: 'รองฯ ฝ่ายบุคคล', approverName: 'นายเกียรติศักดิ์ พลบุตร', status: 'pending', comment: '' },
          { step: 4, roleName: 'ผู้อำนวยการโรงเรียน', approverName: 'นายสมชาย ดีเลิศ', status: 'pending', comment: '' }
        ];
      } else if (['ครู', 'ครูอัตราจ้าง', 'พนักงานราชการ', 'Foreign Teacher'].includes(pos)) {
        // [กรณีลา/ขออนุญาต ของ ครู, ครูอัตราจ้าง, พนักงานราชการ, Foreign Teacher]: เป็นแบบ reverse 5 ->1
        steps = [
          { step: 1, roleName: 'หัวหน้ากลุ่มสาระฯ', approverName: getDeptHeadName(grp), status: 'pending', comment: '' },
          { step: 2, roleName: 'หัวหน้ากลุ่มงานบุคคล', approverName: 'นายเกียรติศักดิ์ พลบุตร', status: 'pending', comment: '' },
          { step: 3, roleName: 'ผู้ช่วยฯฝ่ายบุคคล', approverName: 'นายเกียรติศักดิ์ พลบุตร', status: 'pending', comment: '' },
          { step: 4, roleName: 'รองฯ ฝ่ายบุคคล', approverName: 'นายเกียรติศักดิ์ พลบุตร', status: 'pending', comment: '' },
          { step: 5, roleName: 'ผู้อำนวยการโรงเรียน', approverName: 'นายสมชาย ดีเลิศ', status: 'pending', comment: '' }
        ];
      } else if (['เจ้าหน้าที่ธุรการ', 'เจ้าหน้าที่พัสดุ', 'เจ้าหน้าที่การเงิน'].includes(pos)) {
        // [กรณีลา/ขออนุญาต ของ เจ้าหน้าที่ธุรการ, พัสดุ,การเงิน]:เป็นแบบreverse 5 ->1
        steps = [
          { step: 1, roleName: 'หัวหน้ากลุ่มงานที่ตนเองสังกัด', approverName: getAdminDeptHeadName(grp), status: 'pending', comment: '' },
          { step: 2, roleName: 'หัวหน้ากลุ่มงานบุคคล', approverName: 'นายเกียรติศักดิ์ พลบุตร', status: 'pending', comment: '' },
          { step: 3, roleName: 'ผู้ช่วยฯ ฝ่ายบุคคล', approverName: 'นายเกียรติศักดิ์ พลบุตร', status: 'pending', comment: '' },
          { step: 4, roleName: 'รองฯ ฝ่ายบุคคล', approverName: 'นายเกียรติศักดิ์ พลบุตร', status: 'pending', comment: '' },
          { step: 5, roleName: 'ผู้อำนวยการโรงเรียน', approverName: 'นายสมชาย ดีเลิศ', status: 'pending', comment: '' }
        ];
      } else if (pos.includes('ลูกจ้าง')) {
        // [กรณีลา/ขออนุญาต ของ ลูกจ้าง]: เป็นแบบ reverse 5 ->1
        steps = [
          { step: 1, roleName: 'หัวหน้ากลุ่มงานที่สังกัด', approverName: 'นายประสิทธิ์ การดี', status: 'pending', comment: '' },
          { step: 2, roleName: 'หัวหน้ากลุ่มงานบุคคล', approverName: 'นายเกียรติศักดิ์ พลบุตร', status: 'pending', comment: '' },
          { step: 3, roleName: 'รองฯ ฝ่ายทั่วไป', approverName: 'นายประสิทธิ์ การดี', status: 'pending', comment: '' },
          { step: 4, roleName: 'รองฯ บุคคลตามลำดับ', approverName: 'นายเกียรติศักดิ์ พลบุตร', status: 'pending', comment: '' },
          { step: 5, roleName: 'ผู้อำนวยการโรงเรียน', approverName: 'นายสมชาย ดีเลิศ', status: 'pending', comment: '' }
        ];
      } else {
        // Default fallback workflow
        steps = [
          { step: 1, roleName: 'หัวหน้างานที่สังกัด', approverName: 'นางวิภา วงศ์วิชา', status: 'pending', comment: '' },
          { step: 2, roleName: 'หัวหน้ากลุ่มงานบุคคล', approverName: 'นายเกียรติศักดิ์ พลบุตร', status: 'pending', comment: '' },
          { step: 3, roleName: 'ผู้ช่วยฯ ฝ่ายบุคคล', approverName: 'นายเกียรติศักดิ์ พลบุตร', status: 'pending', comment: '' },
          { step: 4, roleName: 'รองฯ ฝ่ายบุคคล', approverName: 'นายเกียรติศักดิ์ พลบุตร', status: 'pending', comment: '' },
          { step: 5, roleName: 'ผู้อำนวยการโรงเรียน', approverName: 'นายสมชาย ดีเลิศ', status: 'pending', comment: '' }
        ];
      }
    }
    return steps;
  };

  const handleAddAbsentPersonnel = (data: { userName: string; type: 'sick' | 'personal' | 'travel'; date: string; reason: string }) => {
    const userObj = users.find(u => u.name === data.userName);
    const newReq: RequestItem = {
      id: `req-${Date.now()}`,
      type: data.type,
      applicantName: data.userName,
      applicantTel: userObj?.tel || '-',
      applicantPosition: userObj?.position || 'ครู',
      applicantGroup: userObj?.group || 'กลุ่มสาระการเรียนรู้คณิตศาสตร์',
      reason: data.reason || 'เพิ่มข้อมูลการลา/ราชการโดยแอดมินประจำวัน',
      dateStart: data.date,
      dateEnd: data.date,
      timeStart: '08:00',
      timeEnd: '16:30',
      contactAddress: 'โรงเรียนชุมพวงศึกษา',
      substitutions: [],
      status: 'approved',
      currentApprovalStep: 5,
      approvalHistory: [
        { step: 1, roleName: 'แอดมินระบบ', approverName: currentUser?.name || 'admin01', status: 'approved', comment: 'บันทึกการลาโดยแอดมิน', actionDate: new Date().toISOString() }
      ],
      createdAt: new Date().toISOString()
    };
    setRequests(prev => [newReq, ...prev]);
    addNotification(data.userName, `แอดมินได้บันทึกรายชื่อการ${data.type === 'travel' ? 'ไปราชการ' : 'ลา'}ประจำวันที่ ${data.date} ในระบบเรียบร้อยแล้ว`, 'info');
    alert(`เพิ่มรายชื่อ ${data.userName} (${data.type === 'travel' ? 'ไปราชการ' : 'ลา'}) ประจำวันที่ ${data.date} เรียบร้อยแล้ว!`);
  };

  const handleSendIndividualNotice = (targetUserName: string, message: string) => {
    addNotification(targetUserName, message, 'alert');
    sendSimulatedEmail(
      targetUserName,
      getApproverEmail(targetUserName),
      '🔔 แจ้งเตือนจากแอดมิน: กรุณาลงเวลาปฏิบัติราชการ',
      `เรียน ${targetUserName},\n\n${message}\n\nด้วยความเคารพ,\nงานบริหารงานบุคคล โรงเรียนชุมพวงศึกษา`
    );
    alert(`ส่งข้อความแจ้งเตือนเรียบร้อยแล้วไปยัง: ${targetUserName}`);
  };
  const handleAddRequest = (newReqData: Omit<RequestItem, 'id' | 'status' | 'currentApprovalStep' | 'approvalHistory' | 'createdAt'>) => {
    const history = buildWorkflowSteps(newReqData.type, newReqData.applicantPosition, newReqData.applicantGroup);

    const newRequest: RequestItem = {
      ...newReqData,
      id: `req-${Date.now()}`,
      status: 'pending',
      currentApprovalStep: 1,
      approvalHistory: history,
      createdAt: new Date().toISOString()
    };

    const updatedRequests = [...requests, newRequest];
    setRequests(updatedRequests);

    // Alert the first approver immediately via simulated email and notification trigger
    const firstApprover = history[0];
    if (firstApprover) {
      const email = getApproverEmail(firstApprover.approverName);
      sendSimulatedEmail(
        firstApprover.approverName,
        email,
        `[CP-LCV] มีใบคำร้องลา/เดินทางรอการอนุมัติ: ${newRequest.applicantName}`,
        `เรียน ${firstApprover.approverName},\n\nมีใบคำร้องประเภท "${newRequest.type === 'travel' ? 'ไปราชการ' : 'ลา/ขออนุญาต'}" เรื่อง "${newRequest.reason}" เสนอเข้ามาโดย ${newRequest.applicantName} (${newRequest.applicantPosition}) รอคุณพิจารณาอนุมัติในลำดับที่ 1\n\nสามารถเข้าตรวจสอบระบบสารสนเทศเพื่อทำการอนุมัติได้ทันที`
      );
    }

    // Auto-create vehicle booking if travel is using a central vehicle
    if (newRequest.type === 'travel' && newRequest.vehicleType?.startsWith('central')) {
      const vBook: VehicleBooking = {
        id: `v-b-${Date.now()}`,
        requestId: newRequest.id,
        applicantName: newRequest.applicantName,
        purpose: newRequest.reason,
        passengerCount: (newRequest.companions?.length || 0) + 1,
        destination: newRequest.contactAddress,
        dateStart: newRequest.dateStart,
        dateEnd: newRequest.dateEnd,
        timeStart: newRequest.timeStart,
        timeEnd: newRequest.timeEnd,
        vehicleType: newRequest.vehicleType === 'central_van_1' ? 'รถตู้ 1' :
                     newRequest.vehicleType === 'central_van_2' ? 'รถตู้ 2' :
                     newRequest.vehicleType === 'central_truck_1' ? 'รถหกล้อ 1' : 'รถหกล้อ 2',
        driverName: newRequest.driverName || 'รอดำเนินการจัดสรร',
        status: 'pending'
      };
      setVehicleBookings(prev => [...prev, vBook]);
    }

    // Auto-sync
    syncTable('Requests', [
      'ID', 'Type', 'ApplicantName', 'ApplicantTel', 'ApplicantPosition', 'ApplicantGroup',
      'Reason', 'DateStart', 'DateEnd', 'TimeStart', 'TimeEnd', 'ContactAddress',
      'SubstitutionsJSON', 'Status', 'CurrentApprovalStep', 'ApprovalHistoryJSON',
      'AttachmentUrl', 'AttachmentName', 'CreatedAt', 'CompanionsJSON', 'VehicleType',
      'VehiclePlate', 'GoDistance', 'ReturnDistance', 'TotalDistance', 'TotalCompensation',
      'DriverName', 'BudgetSource', 'ClaimAllowance', 'ClaimFuel', 'ClaimOther', 'IsVehicleOnly'
    ], updatedRequests.map(r => [
      r.id, r.type, r.applicantName, r.applicantTel, r.applicantPosition, r.applicantGroup,
      r.reason, r.dateStart, r.dateEnd, r.timeStart, r.timeEnd, r.contactAddress,
      JSON.stringify(r.substitutions || []), r.status, r.currentApprovalStep, JSON.stringify(r.approvalHistory || []),
      r.attachmentUrl || '', r.attachmentName || '', r.createdAt, JSON.stringify(r.companions || []),
      r.vehicleType || '', r.vehiclePlate || '', r.goDistance || 0, r.returnDistance || 0, r.totalDistance || 0,
      r.totalCompensation || 0, r.driverName || '', r.budgetSource || '', r.claimAllowance ? 'TRUE' : 'FALSE',
      r.claimFuel ? 'TRUE' : 'FALSE', r.claimOther ? 'TRUE' : 'FALSE', r.isVehicleOnly ? 'TRUE' : 'FALSE'
    ]));
  };

  // 3. Request Approval / Reject logic
  const handleActionRequest = (requestId: string, step: number, status: 'approved' | 'rejected', comment: string) => {
    let targetRequest: RequestItem | undefined;

    const updated = requests.map(r => {
      if (r.id !== requestId) return r;
      targetRequest = r;

      const history = r.approvalHistory.map(h => {
        if (h.step === step) {
          return { ...h, status, comment, actionDate: new Date().toISOString() };
        }
        return h;
      });

      let nextStep = r.currentApprovalStep;
      let finalStatus = r.status;

      if (status === 'rejected') {
        finalStatus = 'rejected';
      } else if (status === 'approved') {
        if (step === r.approvalHistory.length) {
          finalStatus = 'approved';
          // Also auto-approve associated vehicle booking if applicable
          setVehicleBookings(prev => prev.map(v => v.requestId === requestId ? { ...v, status: 'approved' } : v));
        } else {
          nextStep = step + 1;
        }
      }

      return {
        ...r,
        status: finalStatus,
        currentApprovalStep: nextStep,
        approvalHistory: history
      };
    });

    setRequests(updated);

    // Trigger sequential alerts/emails/notifications
    if (targetRequest) {
      if (status === 'rejected') {
        // Notify applicant of rejection
        addNotification(
          targetRequest.applicantName,
          `❌ คำร้อง "${targetRequest.reason}" ของคุณได้รับการปฏิเสธโดย ${currentUser?.name || 'ผู้อนุมัติ'} (เหตุผล: ${comment})`,
          'alert'
        );
      } else if (status === 'approved') {
        if (step === targetRequest.approvalHistory.length) {
          // Final approved!
          addNotification(
            targetRequest.applicantName,
            `🎉 ยินดีด้วย! คำร้อง "${targetRequest.reason}" ของคุณได้รับการอนุมัติเสร็จสมบูรณ์เรียบร้อยแล้วโดย ผู้อำนวยการโรงเรียน!`,
            'success'
          );
        } else {
          // Notify applicant of progress
          addNotification(
            targetRequest.applicantName,
            `✓ คำร้อง "${targetRequest.reason}" ผ่านการอนุมัติขั้นที่ ${step} (${currentUser?.name || 'ผู้อนุมัติ'}) และกำลังเสนอต่อในลำดับถัดไป`,
            'info'
          );

          // Get the next approver in the sequence and trigger simulation
          const nextApprover = targetRequest.approvalHistory[step]; // targetRequest is state from before edit, so step is 1-based, which perfectly represents index of next step (step 0 is step 1, step 1 is step 2 etc)
          if (nextApprover) {
            const nextEmail = getApproverEmail(nextApprover.approverName);
            sendSimulatedEmail(
              nextApprover.approverName,
              nextEmail,
              `[CP-LCV] ใบคำร้องของ ${targetRequest.applicantName} ผ่านการอนุมัติขั้นที่ ${step} และรอการพิจารณาของคุณ`,
              `เรียน ${nextApprover.approverName},\n\nคำร้องเรื่อง "${targetRequest.reason}" ของ ${targetRequest.applicantName} ผ่านการตรวจลงนามในขั้นที่ ${step} แล้ว ขณะนี้ได้เข้าสู่สายงานพิจารณาของคุณ (ขั้นที่ ${step + 1}: ${nextApprover.roleName}) เรียบร้อยแล้ว\n\nโปรดเปิดระบบดิจิทัล CP-LCV SMART เพื่อพิจารณาดำเนินการต่อไป`
            );
          }
        }
      }
    }

    // Auto-sync
    syncTable('Requests', [
      'ID', 'Type', 'ApplicantName', 'ApplicantTel', 'ApplicantPosition', 'ApplicantGroup',
      'Reason', 'DateStart', 'DateEnd', 'TimeStart', 'TimeEnd', 'ContactAddress',
      'SubstitutionsJSON', 'Status', 'CurrentApprovalStep', 'ApprovalHistoryJSON',
      'AttachmentUrl', 'AttachmentName', 'CreatedAt', 'CompanionsJSON', 'VehicleType',
      'VehiclePlate', 'GoDistance', 'ReturnDistance', 'TotalDistance', 'TotalCompensation',
      'DriverName', 'BudgetSource', 'ClaimAllowance', 'ClaimFuel', 'ClaimOther', 'IsVehicleOnly'
    ], updated.map(r => [
      r.id, r.type, r.applicantName, r.applicantTel, r.applicantPosition, r.applicantGroup,
      r.reason, r.dateStart, r.dateEnd, r.timeStart, r.timeEnd, r.contactAddress,
      JSON.stringify(r.substitutions || []), r.status, r.currentApprovalStep, JSON.stringify(r.approvalHistory || []),
      r.attachmentUrl || '', r.attachmentName || '', r.createdAt, JSON.stringify(r.companions || []),
      r.vehicleType || '', r.vehiclePlate || '', r.goDistance || 0, r.returnDistance || 0, r.totalDistance || 0,
      r.totalCompensation || 0, r.driverName || '', r.budgetSource || '', r.claimAllowance ? 'TRUE' : 'FALSE',
      r.claimFuel ? 'TRUE' : 'FALSE', r.claimOther ? 'TRUE' : 'FALSE', r.isVehicleOnly ? 'TRUE' : 'FALSE'
    ]));
  };

  // 4. Substitution sign off
  const handleSignSubstitution = (requestId: string, subId: string) => {
    const updated = requests.map(r => {
      if (r.id !== requestId) return r;
      const subs = r.substitutions.map(s => {
        if (s.id === subId) {
          return { ...s, signed: true, signedAt: new Date().toISOString() };
        }
        return s;
      });
      return { ...r, substitutions: subs };
    });
    setRequests(updated);
    alert('ลงลายมือชื่อดิจิทัลปฏิบัติการสอนแทนเรียบร้อย!');
  };

  // Manual additional substitution
  const handleAddManualSubstitution = (requestId: string, sub: any) => {
    const updated = requests.map(r => {
      if (r.id !== requestId) return r;
      return { ...r, substitutions: [...(r.substitutions || []), sub] };
    });
    setRequests(updated);
  };

  // 5. Vehicle / Building book approvals
  const handleApproveVehicle = (id: string, approve: boolean) => {
    const updated = vehicleBookings.map(v => v.id === id ? { ...v, status: approve ? 'approved' as const : 'rejected' as const } : v);
    setVehicleBookings(updated);
    alert(`อัปเดตสถานะการจองยานพาหนะเป็น [${approve ? 'อนุมัติ' : 'ปฏิเสธ'}] สำเร็จ!`);
  };

  const handleApproveBuilding = (id: string, approve: boolean) => {
    const updated = buildingBookings.map(b => b.id === id ? { ...b, status: approve ? 'approved' as const : 'rejected' as const } : b);
    setBuildingBookings(updated);
    alert(`อัปเดตสถานะการใช้อาคารสถานที่เรียบร้อย!`);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsUserLoggedIn(true);
    localStorage.setItem('cp_lcv_logged_in', 'true');
    localStorage.setItem('cp_lcv_current_user', JSON.stringify(user));
  };

  const handleRegisterSuccess = async (newUser: User) => {
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    setCurrentUser(newUser);
    setIsUserLoggedIn(true);
    localStorage.setItem('cp_lcv_logged_in', 'true');
    localStorage.setItem('cp_lcv_current_user', JSON.stringify(newUser));

    // Auto-sync back to Google Sheets table 'Users'
    try {
      await syncTable('Users', ['ID', 'Name', 'PIN', 'Position', 'Group', 'Tel', 'Email', 'CreatedAt'], updatedUsers.map(u => [u.id, u.name, u.pin, u.position, u.group, u.tel, u.email, u.createdAt]));
    } catch (e) {
      console.warn('Could not sync user to Google Sheets on registration:', e);
    }
  };

  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  if (!isUserLoggedIn || !currentUser) {
    return (
      <LoginScreen
        users={users}
        onLoginSuccess={handleLoginSuccess}
        onRegisterSuccess={handleRegisterSuccess}
      />
    );
  }

  // Calculate dynamic alerts for badge
  const myUnreadNotifs = notifications.filter(n => n.userId === currentUser.name && !n.read);
  const pendingApprovalsForMe = requests.filter(r => {
    if (r.status !== 'pending') return false;
    const curStep = r.approvalHistory[r.currentApprovalStep - 1];
    return curStep?.approverName === currentUser.name;
  });
  const isVehicleApprover = currentUser.position.includes('ทั่วไป') || currentUser.position.includes('ยานพาหนะ') || currentUser.position.includes('ผู้อำนวยการ');
  const pendingVehiclesForMe = isVehicleApprover ? vehicleBookings.filter(v => v.status === 'pending') : [];

  const totalAlertCount = myUnreadNotifs.length + pendingApprovalsForMe.length + pendingVehiclesForMe.length;

  const handleMarkNotifsAsRead = () => {
    setNotifications(prev => prev.map(n => n.userId === currentUser.name ? { ...n, read: true } : n));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      {/* Real-time Pop-up Toast Container */}
      <ToastContainer
        toasts={toasts}
        onDismiss={handleDismissToast}
        onNavigateToRequest={handleNavigateToRequest}
      />

      {/* Sync Status Banner */}
      {syncMessage && (
        <div className="bg-brand-purple text-white px-4 py-2.5 text-xs font-bold text-center flex items-center justify-center space-x-2 transition duration-500 animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Main Top Header Navbar */}
      <header className="bg-white border-b border-purple-100 px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 sticky top-0 z-40 shadow-sm print:hidden">
        <div className="flex items-center space-x-3.5">
          <div className="bg-gradient-to-tr from-brand-purple to-purple-600 p-2.5 rounded-2xl text-white shadow-md">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-purple-100 text-brand-purple-dark px-2.5 py-0.5 rounded-full font-bold text-xs tracking-wide">SMART HUB</span>
              <span className="text-sm text-gray-500 font-semibold">โรงเรียนชุมพวงศึกษา</span>
            </div>
            <h1 className="text-lg font-bold text-gray-800 font-display">CP-LCV SMART</h1>
          </div>
        </div>

        {/* User Profile Info, Font Size Controller, Notifications & Logout */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Font Size Adjuster Control (ก- / ก / ก+) */}
          <div className="flex items-center space-x-1 bg-slate-100 border border-purple-100 p-1 rounded-2xl shadow-xs">
            <div className="flex items-center space-x-1 px-2 text-gray-600 font-bold text-xs">
              <Type className="w-4 h-4 text-brand-purple" />
              <span className="hidden md:inline">ขนาดอักษร:</span>
            </div>
            <button
              type="button"
              onClick={() => setFontSizeLevel('normal')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                fontSizeLevel === 'normal'
                  ? 'bg-brand-purple text-white shadow-sm'
                  : 'text-gray-600 hover:bg-white hover:text-brand-purple'
              }`}
              title="ขนาดตัวอักษรปกติ"
            >
              ก-
            </button>
            <button
              type="button"
              onClick={() => setFontSizeLevel('large')}
              className={`px-2.5 py-1 rounded-xl text-sm font-bold transition ${
                fontSizeLevel === 'large'
                  ? 'bg-brand-purple text-white shadow-sm'
                  : 'text-gray-600 hover:bg-white hover:text-brand-purple'
              }`}
              title="ขนาดตัวอักษรใหญ่ (ค่าเริ่มต้น)"
            >
              ก
            </button>
            <button
              type="button"
              onClick={() => setFontSizeLevel('xlarge')}
              className={`px-2.5 py-1 rounded-xl text-base font-extrabold transition ${
                fontSizeLevel === 'xlarge'
                  ? 'bg-brand-purple text-white shadow-sm'
                  : 'text-gray-600 hover:bg-white hover:text-brand-purple'
              }`}
              title="ขนาดตัวอักษรใหญ่พิเศษ"
            >
              ก+
            </button>
          </div>

          {/* Notification Bell Button */}
          <button
            onClick={() => {
              setShowNotificationPanel(!showNotificationPanel);
              if (!showNotificationPanel) {
                handleMarkNotifsAsRead();
              }
            }}
            className="relative p-2.5 bg-slate-50 border border-purple-100 hover:bg-purple-50 text-gray-600 hover:text-brand-purple rounded-2xl transition duration-200 shadow-sm"
            title="การแจ้งเตือนระบบ"
          >
            <Bell className="w-5 h-5" />
            {totalAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {totalAlertCount}
              </span>
            )}
          </button>

          <div className="flex items-center space-x-3.5 bg-slate-50 border border-purple-100 px-4 py-2 rounded-2xl shadow-sm">
            <div className="w-9 h-9 rounded-full bg-purple-100 text-brand-purple flex items-center justify-center font-bold text-base">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left">
              <span className="block text-xs text-gray-400 font-bold uppercase tracking-wider leading-none mb-1">ผู้เข้าใช้ระบบ</span>
              <span className="font-bold text-gray-800 block text-sm leading-none">{currentUser.name}</span>
              <span className="text-xs text-brand-purple font-medium block mt-1 leading-none">{currentUser.position} • {currentUser.group}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-xl transition duration-200 flex items-center justify-center ml-2"
              title="ลงชื่อออก"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Mock Role Switcher (Essential for visual walkthrough by supervisors!) */}
          <div className="bg-white border border-purple-100 p-2 rounded-2xl shadow-sm flex items-center space-x-2">
            <span className="font-semibold text-gray-500 text-xs">สลับบัญชีทดสอบ:</span>
            <select
              value={currentUser?.id || ''}
              onChange={(e) => {
                const userObj = users.find(u => u.id === e.target.value);
                if (userObj) {
                  setCurrentUser(userObj);
                  localStorage.setItem('cp_lcv_current_user', JSON.stringify(userObj));
                }
              }}
              className="bg-slate-50 border border-purple-100 rounded-lg p-1.5 font-bold text-xs text-brand-purple focus:ring-1 focus:ring-brand-purple outline-none"
            >
              {users.map((u, idx) => (
                <option key={idx} value={u.id}>{u.name} ({u.position})</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Slide-out Notification and System Email Log Panel */}
      {showNotificationPanel && (
        <div className="bg-white border-b border-purple-100 p-6 shadow-md z-30 print:hidden animate-fadeIn max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-brand-purple" />
              <h2 className="text-sm font-black text-gray-800">ศูนย์แจ้งเตือนระบบและการส่งอีเมลอัตโนมัติ (Real-Time Control)</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleTestToast('approved')}
                className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-lg border border-emerald-200 transition flex items-center space-x-1 cursor-pointer"
                title="ทดสอบการเด้ง Pop-up Toast เมื่อคำร้องได้รับการอนุมัติ"
              >
                <span>🎉 ทดสอบ Toast อนุมัติ</span>
              </button>
              <button
                onClick={() => handleTestToast('rejected')}
                className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold px-3 py-1.5 rounded-lg border border-rose-200 transition flex items-center space-x-1 cursor-pointer"
                title="ทดสอบการเด้ง Pop-up Toast เมื่อคำร้องถูกปฏิเสธ"
              >
                <span>❌ ทดสอบ Toast ไม่อนุมัติ</span>
              </button>
              <button
                onClick={() => setShowNotificationPanel(false)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-gray-500 font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                ปิดแถบแจ้งเตือน
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Column 1: User Notifications */}
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-purple-50 space-y-3">
              <h3 className="text-xs font-bold text-gray-700 flex items-center justify-between">
                <span>🔔 การแจ้งเตือนสถานะคำร้องของคุณ ({myUnreadNotifs.length})</span>
                <span className="text-[9px] text-gray-400 font-normal">สำหรับ: {currentUser.name}</span>
              </h3>
              <div className="space-y-2 max-h-[180px] overflow-y-auto">
                {notifications.filter(n => n.userId === currentUser.name).length === 0 ? (
                  <p className="text-center text-[11px] text-gray-400 py-6">ไม่มีรายการแจ้งเตือนสำหรับคุณในขณะนี้</p>
                ) : (
                  notifications.filter(n => n.userId === currentUser.name).map((n, i) => (
                    <div key={i} className={`p-3 rounded-xl border text-[11px] leading-relaxed flex items-start space-x-2 bg-white ${
                      n.type === 'success' ? 'border-green-100 shadow-sm' :
                      n.type === 'alert' ? 'border-red-100 shadow-sm' : 'border-blue-100 shadow-sm'
                    }`}>
                      <span className="mt-0.5">
                        {n.type === 'success' ? '🎉' : n.type === 'alert' ? '❌' : 'ℹ️'}
                      </span>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-700">{n.text}</p>
                        <span className="text-[9px] text-gray-400 block mt-1">
                          {new Date(n.createdAt).toLocaleTimeString('th-TH')} น.
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column 2: Pending approvals for me */}
            <div className="bg-amber-50/20 p-4 rounded-2xl border border-amber-100 space-y-3">
              <h3 className="text-xs font-bold text-amber-800 flex items-center justify-between">
                <span>✍️ งานที่รอคุณพิจารณาอนุมัติ ({pendingApprovalsForMe.length + pendingVehiclesForMe.length})</span>
                <span className="text-[9px] text-amber-500 font-bold">รอการตรวจลงนาม</span>
              </h3>
              <div className="space-y-2 max-h-[180px] overflow-y-auto">
                {pendingApprovalsForMe.length === 0 && pendingVehiclesForMe.length === 0 ? (
                  <p className="text-center text-[11px] text-gray-400 py-6">คุณไม่มีงานที่ค้างพิจารณาในระบบขณะนี้</p>
                ) : (
                  <>
                    {pendingApprovalsForMe.map((r, i) => (
                      <div key={`app-${i}`} className="p-3 bg-white border border-amber-100 rounded-xl text-[11px] shadow-sm text-left flex justify-between items-center">
                        <div>
                          <p className="font-bold text-gray-700">คำร้อง {r.type === 'travel' ? 'ไปราชการ' : 'การลา'} จาก {r.applicantName}</p>
                          <p className="text-gray-500 text-[10px] mt-0.5 truncate max-w-[200px]">เรื่อง: {r.reason}</p>
                        </div>
                        <button
                          onClick={() => { setActiveTab('approval'); setShowNotificationPanel(false); }}
                          className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-[9px] px-2.5 py-1.5 rounded-lg transition"
                        >
                          ไปอนุมัติ
                        </button>
                      </div>
                    ))}
                    {pendingVehiclesForMe.map((v, i) => (
                      <div key={`veh-${i}`} className="p-3 bg-white border border-purple-100 rounded-xl text-[11px] shadow-sm text-left flex justify-between items-center">
                        <div>
                          <p className="font-bold text-purple-800">จองรถ: {v.vehicleType} ({v.applicantName})</p>
                          <p className="text-gray-500 text-[10px] mt-0.5 truncate max-w-[200px]">ไป: {v.destination}</p>
                        </div>
                        <button
                          onClick={() => { setActiveTab('approval'); setShowNotificationPanel(false); }}
                          className="bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-[9px] px-2.5 py-1.5 rounded-lg transition"
                        >
                          จัดสรร/อนุมัติ
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Column 3: Email logs */}
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-purple-50 space-y-3">
              <h3 className="text-xs font-bold text-purple-800 flex items-center justify-between">
                <span>📧 บันทึกการส่งอีเมลระบบอัตโนมัติ ({emailLogs.length})</span>
                <span className="text-[9px] text-green-500 font-bold">ส่งแล้วทั้งหมด</span>
              </h3>
              <div className="space-y-2 max-h-[180px] overflow-y-auto">
                {emailLogs.map((log, i) => (
                  <div key={i} className="p-3 bg-white border border-slate-100 rounded-xl text-[10px] text-left leading-relaxed">
                    <div className="flex justify-between font-bold text-gray-700">
                      <span className="truncate max-w-[120px]">ส่งหา: {log.recipientName}</span>
                      <span className="text-[8px] text-gray-400">{new Date(log.sentAt).toLocaleTimeString('th-TH')} น.</span>
                    </div>
                    <p className="text-brand-purple font-medium mt-0.5 truncate">{log.recipientEmail}</p>
                    <p className="text-gray-500 mt-1 line-clamp-2 bg-slate-50 p-1.5 rounded border border-slate-100/50">{log.subject}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Main Container Deck */}
      <div className="flex-1 flex flex-col px-4 md:px-8 py-6 gap-6 max-w-7xl mx-auto w-full">
        
        {/* Top Bento Navigation Menu (Always at the top & responsive to browser window width) */}
        <nav className="w-full bg-white p-5 rounded-3xl border border-purple-100 shadow-sm print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-4 bg-brand-purple rounded-full"></span>
              <h3 className="text-sm sm:text-base font-black text-gray-800 tracking-tight">เมนูระบบงานดิจิทัล (9 แท็บหลักเพื่อการปฏิบัติงาน)</h3>
            </div>
            <span className="text-xs bg-purple-50 text-brand-purple font-bold px-3 py-1 rounded-full border border-purple-100/50 self-start sm:self-auto">
              โรงเรียนชุมพวงศึกษา
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2.5">
            {[
              { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
              { id: 'leave-form', label: 'ยื่นใบลา', icon: FileText },
              { id: 'travel-form', label: 'ไปราชการ', icon: FileSpreadsheet },
              { id: 'teaching-mgt', label: 'คาบสอนแทน', icon: BookOpen },
              { id: 'vehicle-mgt', label: 'จองรถ/สถานที่', icon: Car },
              { id: 'saraban', label: 'งานสารบรรณ', icon: FilePlus2 },
              { id: 'approval', label: 'อนุมัติคำร้อง', icon: UserCheck },
              { id: 'reports', label: 'สรุปสารสนเทศ', icon: BarChart3 },
              { id: 'admin', label: 'ฐานข้อมูล', icon: Database },
            ].map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 text-center select-none ${
                    isActive
                      ? 'bg-gradient-to-br from-brand-purple to-purple-700 text-white border-transparent shadow-lg shadow-purple-500/15 scale-[1.02]'
                      : 'bg-slate-50 hover:bg-white text-gray-600 border-purple-100/30 hover:border-brand-purple-light hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  {/* Icon container */}
                  <div className={`p-2.5 rounded-xl mb-2 transition-transform duration-300 group-hover:scale-110 ${
                    isActive ? 'bg-white/20 text-white' : 'bg-purple-50 text-brand-purple group-hover:bg-brand-purple group-hover:text-white'
                  }`}>
                    <IconComponent className="w-5 h-5" />
                  </div>

                  {/* Label */}
                  <span className={`text-xs sm:text-sm font-bold tracking-tight leading-tight ${
                    isActive ? 'text-white font-extrabold' : 'text-gray-700 group-hover:text-brand-purple'
                  }`}>
                    {tab.label}
                  </span>
                  
                  {/* Active dynamic indicator dot */}
                  {isActive && (
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Main Workspace where the selected tab is loaded dynamically */}
        <main className="w-full min-w-0">
          {activeTab === 'dashboard' && (
            <Dashboard
              currentUser={currentUser}
              users={users}
              requests={requests}
              dailyStats={dailyStats}
              vehicleBookings={vehicleBookings}
              buildingBookings={buildingBookings}
              leaveBalances={leaveBalances}
              edocs={edocs}
              certs={certs}
              onAddEdoc={(newEdoc) => setEdocs(prev => [...prev, { ...newEdoc, id: `ed-${Date.now()}` }])}
              onAddCert={(newCert) => setCerts(prev => [...prev, { ...newCert, id: `c-${Date.now()}` }])}
              onAddAbsentPersonnel={handleAddAbsentPersonnel}
              onSendIndividualNotice={handleSendIndividualNotice}
              onAddVehicleBooking={(v) => {
                const newBooking: VehicleBooking = {
                  ...v,
                  id: `v-b-${Date.now()}`,
                  status: 'pending'
                };
                setVehicleBookings([...vehicleBookings, newBooking]);
              }}
              onAddBuildingBooking={(b) => {
                const newBooking: BuildingBooking = {
                  ...b,
                  id: `b-b-${Date.now()}`,
                  status: 'pending',
                  currentStep: 1,
                  approvalHistory: [
                    { step: 1, roleName: 'หัวหน้างานทั่วไป', approverName: approverRoles.find(r => r.roleId === 'head_general')?.assignedUserName || 'นายประสิทธิ์ การดี', status: 'pending', comment: '' },
                    { step: 2, roleName: 'ผู้ช่วยผู้อำนวยการกลุ่มบริหารทั่วไป', approverName: approverRoles.find(r => r.roleId === 'assistant_general')?.assignedUserName || 'นายประสิทธิ์ การดี', status: 'pending', comment: '' },
                    { step: 3, roleName: 'รองผู้อำนวยการกลุ่มบริหารทั่วไป', approverName: approverRoles.find(r => r.roleId === 'vice_general')?.assignedUserName || 'นายประสิทธิ์ การดี', status: 'pending', comment: '' },
                    { step: 4, roleName: 'ผู้อำนวยการโรงเรียน', approverName: approverRoles.find(r => r.roleId === 'director')?.assignedUserName || 'นายสมชาย ดีเลิศ', status: 'pending', comment: '' }
                  ]
                };
                setBuildingBookings([...buildingBookings, newBooking]);
                addNotification(currentUser?.name || 'ผู้ใช้งาน', `ยื่นขอใช้อาคารสถานที่: ${b.buildingName} เรียบร้อยแล้ว`, 'info');
              }}
            />
          )}

          {activeTab === 'leave-form' && (
            <LeaveForm
              currentUser={currentUser}
              users={users}
              onSubmitRequest={handleAddRequest}
            />
          )}

          {activeTab === 'travel-form' && (
            <TravelForm
              currentUser={currentUser}
              users={users}
              onSubmitRequest={handleAddRequest}
            />
          )}

          {activeTab === 'teaching-mgt' && (
            <TeachingManagement
              currentUser={currentUser}
              users={users}
              requests={requests}
              onSignSubstitution={handleSignSubstitution}
              onAddManualSubstitution={handleAddManualSubstitution}
            />
          )}

          {activeTab === 'vehicle-mgt' && (
            <VehicleManagement
              currentUser={currentUser}
              vehicleBookings={vehicleBookings}
              buildingBookings={buildingBookings}
              onApproveVehicle={handleApproveVehicle}
              onApproveBuilding={handleApproveBuilding}
            />
          )}

          {activeTab === 'approval' && (
            <ApprovalDashboard
              currentUser={currentUser}
              users={users}
              requests={requests}
              approverRoles={approverRoles}
              vehicleBookings={vehicleBookings}
              buildingBookings={buildingBookings}
              onActionRequest={handleActionRequest}
              onApproveVehicle={handleApproveVehicle}
              onUpdateVehicleBookings={setVehicleBookings}
            />
          )}

          {activeTab === 'saraban' && (
            <Saraban
              currentUser={currentUser}
              requests={requests}
              edocs={edocs}
              certs={certs}
              onAddEdoc={(newEdoc) => setEdocs([...edocs, { ...newEdoc, id: `ed-${Date.now()}` }])}
              onAddCert={(newCert) => setCerts([...certs, { ...newCert, id: `c-${Date.now()}` }])}
              onUpdateEdocStatus={(id, status) => setEdocs(edocs.map(e => e.id === id ? { ...e, status } : e))}
            />
          )}

          {activeTab === 'reports' && (
            <ReportDashboard
              requests={requests}
              vehicleBookings={vehicleBookings}
              buildingBookings={buildingBookings}
              users={users}
              currentUser={currentUser}
              onTriggerToast={(t) => {
                setToasts(prev => [
                  {
                    ...t,
                    id: `toast-${Date.now()}`,
                    timestamp: new Date().toLocaleTimeString('th-TH') + ' น.'
                  },
                  ...prev
                ].slice(0, 5));
                playNotificationSound();
              }}
            />
          )}

          {activeTab === 'admin' && (
            <AdminHub
              currentUser={currentUser}
              users={users}
              approverRoles={approverRoles}
              vehicleBookings={vehicleBookings}
              buildingBookings={buildingBookings}
              requests={requests}
              onUpdateUsers={setUsers}
              onUpdateApprovers={setApproverRoles}
              onUpdateVehicles={setVehicleBookings}
              onUpdateBuildings={setBuildingBookings}
              onResetAllData={handleResetAllData}
              onSyncGoogleSheets={triggerManualSync}
              isSyncing={isSyncing}
            />
          )}
        </main>
      </div>

      {/* Humble aesthetic footer */}
      <footer className="bg-white border-t border-purple-50 py-4 text-center text-[10px] text-gray-400 print:hidden mt-auto">
        <p>© 2026 CP-LCV SMART · ระบบดิจิทัลเพื่อการบริหารจัดการภารกิจบุคลากร โรงเรียนชุมพวงศึกษา</p>
        <p className="mt-0.5 text-[9px] text-gray-300">สำนักงานเขตพื้นที่การศึกษามัธยมศึกษานครราชสีมา</p>
      </footer>
    </div>
  );
}
