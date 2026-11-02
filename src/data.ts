import { User, RequestItem, DailyStat, ApproverRole, LeaveBalance, VehicleBooking, BuildingBooking, EdocOrder, CertificateRequest } from './types';

export const POSITIONS = [
  'ผู้อำนวยการโรงเรียน',
  'รองผู้อำนวยการโรงเรียนกลุ่มบริหารงานบุคคล',
  'รองผู้อำนวยการโรงเรียนกลุ่มบริหารวิชาการ',
  'รองผู้อำนวยการโรงเรียนกลุ่มบริหารทั่วไป',
  'รองผู้อำนวยการโรงเรียนกลุ่มบริหารแผนงานและงบประมาณ',
  'ครู',
  'ครูอัตราจ้าง',
  'พนักงานราชการ',
  'เจ้าหน้าที่ธุรการ',
  'เจ้าหน้าที่พัสดุ',
  'เจ้าหน้าที่การเงิน',
  'Foreign Teacher',
  'ลูกจ้าง',
  'นักศึกษาฝึกประสบการณ์'
];

export const GROUPS = [
  'ฝ่ายบริหาร',
  'กลุ่มสาระการเรียนรู้คณิตศาสตร์',
  'กลุ่มสาระการเรียนวิทยาศาสตร์และเทคโนโลยี',
  'กลุ่มสาระการเรียนรู้ภาษาไทย',
  'กลุ่มสาระการเรียนรู้สังคมศึกษา',
  'กลุ่มสาระการเรียนรู้การงานอาชีพ',
  'กลุ่มสาระการเรียนรู้สุขศึกษาและพลศึกษา',
  'กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ',
  'กลุ่มสาระการเรียนรู้ศิลปะ',
  'กลุ่มบริหารวิชาการ',
  'กลุ่มบริหารทั่วไป',
  'กลุ่มอำนวยการ',
  'กลุ่มบริหารงานบุคคล',
  'กลุ่มแผนงานและงบประมาณ'
];

export const INITIAL_USERS: User[] = [
  {
    id: 'u0',
    name: 'admin01',
    pin: '1234',
    position: 'แอดมินระบบ',
    group: '-',
    tel: '080-000-0000',
    email: 'admin01@cp.ac.th',
    createdAt: '2026-05-01T08:00:00Z'
  },
  {
    id: 'u1',
    name: 'นายสมชาย ดีเลิศ',
    pin: '1234',
    position: 'ผู้อำนวยการโรงเรียน',
    group: 'ฝ่ายบริหาร',
    tel: '081-234-5678',
    email: 'somchai@cp.ac.th',
    createdAt: '2026-05-01T08:00:00Z'
  },
  {
    id: 'u2',
    name: 'นางวิภา วงศ์วิชา',
    pin: '1111',
    position: 'รองผู้อำนวยการโรงเรียนกลุ่มบริหารวิชาการ',
    group: 'ฝ่ายบริหาร',
    tel: '082-345-6789',
    email: 'wipa@cp.ac.th',
    createdAt: '2026-05-01T08:00:00Z'
  },
  {
    id: 'u3',
    name: 'นายเกียรติศักดิ์ พลบุตร',
    pin: '2222',
    position: 'รองผู้อำนวยการโรงเรียนกลุ่มบริหารงานบุคคล',
    group: 'ฝ่ายบริหาร',
    tel: '083-456-7890',
    email: 'kiat@cp.ac.th',
    createdAt: '2026-05-01T08:00:00Z'
  },
  {
    id: 'u4',
    name: 'นายประสิทธิ์ การดี',
    pin: '3333',
    position: 'รองผู้อำนวยการโรงเรียนกลุ่มบริหารทั่วไป',
    group: 'ฝ่ายบริหาร',
    tel: '084-567-8901',
    email: 'prasit@cp.ac.th',
    createdAt: '2026-05-01T08:00:00Z'
  },
  {
    id: 'u5',
    name: 'นางสาวนงนุช แผนดี',
    pin: '4444',
    position: 'รองผู้อำนวยการโรงเรียนกลุ่มบริหารแผนงานและงบประมาณ',
    group: 'ฝ่ายบริหาร',
    tel: '085-678-9012',
    email: 'nongnuch@cp.ac.th',
    createdAt: '2026-05-01T08:00:00Z'
  },
  {
    id: 'u6',
    name: 'ครูวิทยา สอนดี',
    pin: '5555',
    position: 'ครู',
    group: 'กลุ่มสาระการเรียนวิทยาศาสตร์และเทคโนโลยี',
    tel: '086-789-0123',
    email: 'wittaya@cp.ac.th',
    createdAt: '2026-05-01T08:00:00Z'
  },
  {
    id: 'u7',
    name: 'ครูสมศรี ศิลป์สวย',
    pin: '6666',
    position: 'ครู',
    group: 'กลุ่มสาระการเรียนรู้ศิลปะ',
    tel: '087-890-1234',
    email: 'somsri@cp.ac.th',
    createdAt: '2026-05-01T08:00:00Z'
  },
  {
    id: 'u8',
    name: 'นายกานต์ พัสดุดี',
    pin: '7777',
    position: 'เจ้าหน้าที่พัสดุ',
    group: 'กลุ่มแผนงานและงบประมาณ',
    tel: '088-901-2345',
    email: 'karn@cp.ac.th',
    createdAt: '2026-05-01T08:00:00Z'
  },
  {
    id: 'u9',
    name: 'นางพิมพ์ใจ ขยันทำ',
    pin: '8888',
    position: 'ลูกจ้าง',
    group: 'กลุ่มบริหารทั่วไป',
    tel: '089-012-3456',
    email: '', // Optional for ลูกจ้าง
    createdAt: '2026-05-01T08:00:00Z'
  },
  {
    id: 'u10',
    name: 'ครูคณิต คิดเร็ว',
    pin: '9999',
    position: 'ครู',
    group: 'กลุ่มสาระการเรียนรู้คณิตศาสตร์',
    tel: '080-123-4567',
    email: 'khanit@cp.ac.th',
    createdAt: '2026-05-01T08:00:00Z'
  },
  {
    id: 'u11',
    name: 'นายกฤษณะ ศึกษาดี',
    pin: '1212',
    position: 'นักศึกษาฝึกประสบการณ์',
    group: 'กลุ่มสาระการเรียนรู้คณิตศาสตร์',
    tel: '081-000-1111',
    email: 'krishna@cp.ac.th',
    createdAt: '2026-05-01T08:00:00Z'
  },
  {
    id: 'u12',
    name: 'นางสาววิชุดา งานดี',
    pin: '1313',
    position: 'เจ้าหน้าที่ธุรการ',
    group: 'กลุ่มบริหารงานบุคคล',
    tel: '082-000-2222',
    email: 'wichuda@cp.ac.th',
    createdAt: '2026-05-01T08:00:00Z'
  }
];

export const INITIAL_APPROVER_ROLES: ApproverRole[] = [
  { roleId: 'director', assignedUserName: 'นายสมชาย ดีเลิศ' },
  { roleId: 'vice_academic', assignedUserName: 'นางวิภา วงศ์วิชา' },
  { roleId: 'vice_personnel', assignedUserName: 'นายเกียรติศักดิ์ พลบุตร' },
  { roleId: 'vice_general', assignedUserName: 'นายประสิทธิ์ การดี' },
  { roleId: 'vice_budget', assignedUserName: 'นางสาวนงนุช แผนดี' },
  { roleId: 'head_academic', assignedUserName: 'นางวิภา วงศ์วิชา' },
  { roleId: 'head_personnel', assignedUserName: 'นายเกียรติศักดิ์ พลบุตร' },
  { roleId: 'head_general', assignedUserName: 'นายประสิทธิ์ การดี' },
  { roleId: 'head_budget', assignedUserName: 'นางสาวนงนุช แผนดี' },
  { roleId: 'head_vehicle', assignedUserName: 'นายประสิทธิ์ การดี' },
  { roleId: 'head_saraban', assignedUserName: 'นายเกียรติศักดิ์ พลบุตร' }
];

export const INITIAL_LEAVE_BALANCES: LeaveBalance[] = [
  { userName: 'ครูวิทยา สอนดี', sickDays: 4, personalDays: 2, otherDays: 0 },
  { userName: 'ครูสมศรี ศิลป์สวย', sickDays: 2, personalDays: 1, otherDays: 0 },
  { userName: 'นายกานต์ พัสดุดี', sickDays: 5, personalDays: 3, otherDays: 0 },
  { userName: 'นางพิมพ์ใจ ขยันทำ', sickDays: 10, personalDays: 5, otherDays: 0 },
  { userName: 'ครูคณิต คิดเร็ว', sickDays: 1, personalDays: 0, otherDays: 0 }
];

export const INITIAL_DAILY_STATS: DailyStat[] = [
  { group: 'ฝ่ายบริหาร', date: '2026-07-20', presentCount: 5, absentCount: 0, details: { sick: [], personal: [], travel: [] } },
  { group: 'กลุ่มสาระการเรียนรู้คณิตศาสตร์', date: '2026-07-20', presentCount: 12, absentCount: 1, details: { sick: ['ครูสมคิด สมภักดี'], personal: [], travel: [] } },
  { group: 'กลุ่มสาระการเรียนวิทยาศาสตร์และเทคโนโลยี', date: '2026-07-20', presentCount: 15, absentCount: 1, details: { sick: [], personal: [], travel: ['ครูวิทยา สอนดี'] } },
  { group: 'กลุ่มสาระการเรียนรู้ภาษาไทย', date: '2026-07-20', presentCount: 10, absentCount: 0, details: { sick: [], personal: [], travel: [] } },
  { group: 'กลุ่มสาระการเรียนรู้สังคมศึกษา', date: '2026-07-20', presentCount: 8, absentCount: 0, details: { sick: [], personal: [], travel: [] } },
  { group: 'กลุ่มสาระการเรียนรู้การงานอาชีพ', date: '2026-07-20', presentCount: 7, absentCount: 0, details: { sick: [], personal: [], travel: [] } },
  { group: 'กลุ่มสาระการเรียนรู้สุขศึกษาและพลศึกษา', date: '2026-07-20', presentCount: 6, absentCount: 0, details: { sick: [], personal: [], travel: [] } },
  { group: 'กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ', date: '2026-07-20', presentCount: 11, absentCount: 0, details: { sick: [], personal: [], travel: [] } },
  { group: 'กลุ่มสาระการเรียนรู้ศิลปะ', date: '2026-07-20', presentCount: 5, absentCount: 0, details: { sick: [], personal: [], travel: [] } },
  { group: 'เจ้าหน้าที่สนับสนุนการสอน', date: '2026-07-20', presentCount: 4, absentCount: 0, details: { sick: [], personal: [], travel: [] } },
  { group: 'ลูกจ้าง', date: '2026-07-20', presentCount: 8, absentCount: 0, details: { sick: [], personal: [], travel: [] } }
];

export const INITIAL_REQUESTS: RequestItem[] = [
  {
    id: 'req1',
    type: 'travel',
    applicantName: 'ครูวิทยา สอนดี',
    applicantTel: '086-789-0123',
    applicantPosition: 'ครู',
    applicantGroup: 'กลุ่มสาระการเรียนวิทยาศาสตร์และเทคโนโลยี',
    reason: 'พานักเรียนเข้าร่วมการแข่งขันหุ่นยนต์ระดับภาค',
    dateStart: '2026-07-20',
    dateEnd: '2026-07-20',
    timeStart: '08:00',
    timeEnd: '16:30',
    contactAddress: 'มหาวิทยาลัยเทคโนโลยีสุรนารี นครราชสีมา',
    substitutions: [
      {
        id: 'sub1',
        teacherName: 'ครูวิทยา สอนดี',
        period: 'คาบที่ 3 (10:30-11:30)',
        courseCode: 'ว21101',
        courseName: 'วิทยาศาสตร์ 1',
        className: 'ม.1/2',
        assignedTask: 'ทำแบบฝึกหัดบทที่ 2 และเขียนบันทึกการทดลอง',
        substituteTeacherName: 'ครูคณิต คิดเร็ว',
        signed: true,
        signedAt: '2026-07-20T08:30:00Z'
      }
    ],
    status: 'approved',
    currentApprovalStep: 5,
    approvalHistory: [
      { step: 1, roleName: 'หัวหน้ากลุ่มสาระวิทยาศาสตร์และเทคโนโลยี', approverName: 'ครูวิทยา สอนดี', status: 'approved', comment: 'อนุมัติผ่านระบบ', actionDate: '2026-07-19T09:00:00Z' },
      { step: 2, roleName: 'หัวหน้ากลุ่มงานบุคคล', approverName: 'นายเกียรติศักดิ์ พลบุตร', status: 'approved', comment: 'เห็นควรอนุมัติ', actionDate: '2026-07-19T10:00:00Z' },
      { step: 3, roleName: 'ผู้ช่วยฯ ฝ่ายบุคคล', approverName: 'นายเกียรติศักดิ์ พลบุตร', status: 'approved', comment: 'เห็นควรอนุมัติ', actionDate: '2026-07-19T10:30:00Z' },
      { step: 4, roleName: 'รองฯ ฝ่ายบุคคล', approverName: 'นายเกียรติศักดิ์ พลบุตร', status: 'approved', comment: 'อนุมัติเห็นควรเสนอ ผอ.', actionDate: '2026-07-19T11:00:00Z' },
      { step: 5, roleName: 'ผู้อำนวยการโรงเรียน', approverName: 'นายสมชาย ดีเลิศ', status: 'approved', comment: 'อนุญาตและให้เดินทางโดยปลอดภัย', actionDate: '2026-07-19T14:00:00Z' }
    ],
    companions: ['นายประสาท วิชาดี', 'นางสาวรุ่งทิพย์ เรียนสนุก'],
    vehicleType: 'central_van_1',
    driverName: 'นายเฉลิม ขับดี',
    budgetSource: 'งบประมาณโครงการ',
    claimAllowance: true,
    claimFuel: true,
    claimOther: false,
    attachmentUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
    attachmentName: 'doc_robotics_comp_2026.pdf',
    createdAt: '2026-07-18T10:00:00Z'
  },
  {
    id: 'req2',
    type: 'sick',
    applicantName: 'ครูสมศรี ศิลป์สวย',
    applicantTel: '087-890-1234',
    applicantPosition: 'ครู',
    applicantGroup: 'กลุ่มสาระการเรียนรู้ศิลปะ',
    reason: 'มีอาการไข้ขึ้นสูงและเจ็บคอ แพทย์สั่งหยุดพักผ่อน',
    dateStart: '2026-07-21',
    dateEnd: '2026-07-22',
    timeStart: '08:00',
    timeEnd: '16:30',
    contactAddress: 'บ้านเลขที่ 45 หมู่ 2 อ.ชุมพวง จ.นครราชสีมา',
    substitutions: [
      {
        id: 'sub2',
        teacherName: 'ครูสมศรี ศิลป์สวย',
        period: 'คาบที่ 5 (13:00-14:00)',
        courseCode: 'ศ31101',
        courseName: 'ศิลปะพื้นฐาน',
        className: 'ม.4/1',
        assignedTask: 'วาดภาพระบายสีหุ่นนิ่งส่งท้ายคาบ',
        substituteTeacherName: 'ครูวิทยา สอนดี',
        signed: false
      }
    ],
    status: 'pending',
    currentApprovalStep: 1,
    approvalHistory: [
      { step: 1, roleName: 'หัวหน้ากลุ่มสาระศิลปะ', approverName: 'ครูสมศรี ศิลป์สวย', status: 'pending', comment: '' },
      { step: 2, roleName: 'หัวหน้ากลุ่มงานบุคคล', approverName: 'นายเกียรติศักดิ์ พลบุตร', status: 'pending', comment: '' },
      { step: 3, roleName: 'ผู้ช่วยฯ ฝ่ายบุคคล', approverName: 'นายเกียรติศักดิ์ พลบุตร', status: 'pending', comment: '' },
      { step: 4, roleName: 'รองฯ ฝ่ายบุคคล', approverName: 'นายเกียรติศักดิ์ พลบุตร', status: 'pending', comment: '' },
      { step: 5, roleName: 'ผู้อำนวยการโรงเรียน', approverName: 'นายสมชาย ดีเลิศ', status: 'pending', comment: '' }
    ],
    createdAt: '2026-07-20T09:30:00Z'
  }
];

export const INITIAL_VEHICLE_BOOKINGS: VehicleBooking[] = [
  {
    id: 'v1',
    requestId: 'req1',
    applicantName: 'ครูวิทยา สอนดี',
    purpose: 'พานักเรียนเข้าร่วมการแข่งขันหุ่นยนต์ระดับภาค',
    passengerCount: 6,
    destination: 'มหาวิทยาลัยเทคโนโลยีสุรนารี นครราชสีมา',
    dateStart: '2026-07-20',
    dateEnd: '2026-07-20',
    timeStart: '08:00',
    timeEnd: '16:30',
    vehicleType: 'รถตู้ 1',
    driverName: 'นายเฉลิม ขับดี',
    status: 'approved'
  }
];

export const INITIAL_BUILDING_BOOKINGS: BuildingBooking[] = [
  {
    id: 'b1',
    applicantName: 'ครูคณิต คิดเร็ว',
    buildingName: 'หอประชุมโรงเรียนชุมพวงศึกษา',
    purpose: 'ปฐมนิเทศและอบรมติวความรู้คณิตศาสตร์โอลิมปิก',
    dateStart: '2026-07-25',
    timeStart: '09:00',
    timeEnd: '12:00',
    status: 'pending'
  }
];

export const INITIAL_EDOCS: EdocOrder[] = [
  {
    id: 'ed1',
    requestId: 'req1',
    commandNo: 'ศธ 04225.102/ว045',
    title: 'คำสั่งแต่งตั้งคณะกรรมการนำนักเรียนเข้าร่วมการแข่งขันหุ่นยนต์พัฒนาเยาวชน',
    travelNames: ['ครูวิทยา สอนดี', 'นายประสาท วิชาดี', 'นางสาวรุ่งทิพย์ เรียนสนุก'],
    dateStr: '2026-07-20',
    location: 'มหาวิทยาลัยเทคโนโลยีสุรนารี นครราชสีมา',
    groupNotes: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี',
    status: 'เรียบร้อย'
  }
];

export const INITIAL_CERT_REQUESTS: CertificateRequest[] = [
  {
    id: 'c1',
    applicantName: 'ครูวิทยา สอนดี',
    requestDate: '2026-07-15',
    topic: 'เกียรติบัตรนักเรียนผ่านการฝึกอบรมหุ่นยนต์เบื้องต้น',
    certCount: 25,
    startNo: 101
  }
];
