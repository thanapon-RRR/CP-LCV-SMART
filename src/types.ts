/**
 * Types and interfaces for the CP-LCV SMART system
 */

export interface User {
  id: string;
  name: string;
  pin: string;
  position: string;
  group: string;
  tel: string;
  email: string;
  createdAt: string;
}

export interface TeachingSubstitution {
  id: string;
  teacherName: string;
  period: string; // คาบสอน
  courseCode: string;
  courseName: string;
  assignedTask: string;
  substituteTeacherName: string;
  className: string; // e.g. ม.1/1
  signed: boolean; // signed off by substitute teacher
  signedAt?: string;
}

export interface RequestItem {
  id: string;
  type: 'sick' | 'personal' | 'maternity' | 'ordination' | 'out_of_bounds' | 'attendance' | 'return_time' | 'travel';
  applicantName: string;
  applicantTel: string;
  applicantPosition: string;
  applicantGroup: string;
  reason: string;
  dateStart: string;
  dateEnd: string;
  timeStart: string;
  timeEnd: string;
  contactAddress: string;
  substitutions: TeachingSubstitution[];
  status: 'pending' | 'approved' | 'rejected';
  currentApprovalStep: number;
  approvalHistory: ApprovalHistoryItem[];
  attachmentUrl?: string; // or file ID
  attachmentName?: string;
  createdAt: string;
  
  // Specific for travel
  companions?: string[];
  vehicleType?: string; // 'private' | 'central_van_1' | 'central_van_2' | 'central_truck_1' | 'central_truck_2' | 'public'
  vehiclePlate?: string;
  goDistance?: number;
  returnDistance?: number;
  totalDistance?: number;
  totalCompensation?: number;
  driverName?: string;
  budgetSource?: string;
  claimAllowance?: boolean;
  claimFuel?: boolean;
  claimOther?: boolean;
  
  // Specific for vehicle reservation (outside official travel)
  vehicleId?: string;
  isVehicleOnly?: boolean;
}

export interface ApprovalHistoryItem {
  step: number;
  roleName: string;
  approverName: string;
  status: 'pending' | 'approved' | 'rejected';
  comment: string;
  actionDate?: string;
}

export interface VehicleBooking {
  id: string;
  requestId?: string;
  applicantName: string;
  purpose: string;
  passengerCount: number;
  destination: string;
  dateStart: string;
  dateEnd: string;
  timeStart: string;
  timeEnd: string;
  vehicleType: string; // 'รถตู้ 1', 'รถตู้ 2', 'รถหกล้อ 1', 'รถหกล้อ 2'
  driverName: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface BuildingBooking {
  id: string;
  applicantName: string;
  buildingName: string;
  purpose: string;
  dateStart: string;
  timeStart: string;
  timeEnd: string;
  status: 'pending' | 'approved' | 'rejected';
  currentStep?: number;
  approvalHistory?: ApprovalHistoryItem[];
}

export interface DailyStat {
  group: string; // e.g. "กลุ่มสาระการเรียนรู้คณิตศาสตร์"
  date: string;
  presentCount: number;
  absentCount: number;
  details: {
    sick: string[]; // names of people sick
    personal: string[]; // names of people on personal leave
    travel: string[]; // names of people on travel
  };
}

export interface EdocOrder {
  id: string;
  requestId: string;
  commandNo: string;
  title: string;
  travelNames: string[];
  dateStr: string;
  location: string;
  groupNotes: string;
  status: 'รอดำเนินการ' | 'เรียบร้อย';
}

export interface CertificateRequest {
  id: string;
  applicantName: string;
  requestDate: string;
  topic: string;
  certCount: number;
  startNo: number;
}

export interface ApproverRole {
  roleId: string; // 'director', 'vice_academic', 'vice_personnel', 'vice_general', 'vice_budget', 'head_personnel', 'head_academic', 'head_general', 'head_budget', 'head_vehicle', 'head_saraban'
  assignedUserName: string; // Full Name from Users table
}

export interface LeaveBalance {
  userName: string;
  sickDays: number;
  personalDays: number;
  otherDays: number;
}
