import { User, RequestItem, DailyStat, ApproverRole, LeaveBalance, VehicleBooking, BuildingBooking, EdocOrder, CertificateRequest } from '../types';
import { INITIAL_USERS, INITIAL_REQUESTS, INITIAL_DAILY_STATS, INITIAL_APPROVER_ROLES, INITIAL_LEAVE_BALANCES, INITIAL_VEHICLE_BOOKINGS, INITIAL_BUILDING_BOOKINGS, INITIAL_EDOCS, INITIAL_CERT_REQUESTS } from '../data';

const DB_FILENAME = 'CP-LCV_SMART_Database';

/**
 * Searches the user's Google Drive for the CP-LCV SMART database spreadsheet.
 * Returns the file ID if found, or null if not.
 */
export async function findDatabaseFile(accessToken: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(`name = '${DB_FILENAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) {
      console.error('Failed to search Drive:', await res.text());
      return null;
    }
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (err) {
    console.error('Error finding database file:', err);
    return null;
  }
}

/**
 * Creates a brand new Google Sheet in the user's Google Drive with all the necessary sheet tabs.
 * Pre-populates it with initial seed data.
 */
export async function createDatabaseFile(accessToken: string): Promise<string> {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';
  const payload = {
    properties: { title: DB_FILENAME },
    sheets: [
      { properties: { title: 'Users' } },
      { properties: { title: 'Requests' } },
      { properties: { title: 'DailyStats' } },
      { properties: { title: 'Approvers' } },
      { properties: { title: 'LeaveBalances' } },
      { properties: { title: 'Vehicles' } },
      { properties: { title: 'Buildings' } },
      { properties: { title: 'Edoc' } },
      { properties: { title: 'Certificates' } }
    ]
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`Failed to create spreadsheet: ${await res.text()}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;

  // Now seed all the sheets
  await seedSpreadsheet(accessToken, spreadsheetId);

  return spreadsheetId;
}

/**
 * Seeds the newly created spreadsheet with the starting mock data.
 */
async function seedSpreadsheet(accessToken: string, spreadsheetId: string) {
  const valuesToSet = [
    {
      range: 'Users!A1',
      values: [
        ['ID', 'Name', 'PIN', 'Position', 'Group', 'Tel', 'Email', 'CreatedAt'],
        ...INITIAL_USERS.map(u => [u.id, u.name, u.pin, u.position, u.group, u.tel, u.email, u.createdAt])
      ]
    },
    {
      range: 'Approvers!A1',
      values: [
        ['RoleID', 'AssignedUserName'],
        ...INITIAL_APPROVER_ROLES.map(r => [r.roleId, r.assignedUserName])
      ]
    },
    {
      range: 'LeaveBalances!A1',
      values: [
        ['UserName', 'SickDays', 'PersonalDays', 'OtherDays'],
        ...INITIAL_LEAVE_BALANCES.map(b => [b.userName, b.sickDays, b.personalDays, b.otherDays])
      ]
    },
    {
      range: 'DailyStats!A1',
      values: [
        ['Group', 'Date', 'PresentCount', 'AbsentCount', 'DetailsJSON'],
        ...INITIAL_DAILY_STATS.map(s => [s.group, s.date, s.presentCount, s.absentCount, JSON.stringify(s.details)])
      ]
    },
    {
      range: 'Requests!A1',
      values: [
        [
          'ID', 'Type', 'ApplicantName', 'ApplicantTel', 'ApplicantPosition', 'ApplicantGroup',
          'Reason', 'DateStart', 'DateEnd', 'TimeStart', 'TimeEnd', 'ContactAddress',
          'SubstitutionsJSON', 'Status', 'CurrentApprovalStep', 'ApprovalHistoryJSON',
          'AttachmentUrl', 'AttachmentName', 'CreatedAt', 'CompanionsJSON', 'VehicleType',
          'VehiclePlate', 'GoDistance', 'ReturnDistance', 'TotalDistance', 'TotalCompensation',
          'DriverName', 'BudgetSource', 'ClaimAllowance', 'ClaimFuel', 'ClaimOther', 'IsVehicleOnly'
        ],
        ...INITIAL_REQUESTS.map(r => [
          r.id, r.type, r.applicantName, r.applicantTel, r.applicantPosition, r.applicantGroup,
          r.reason, r.dateStart, r.dateEnd, r.timeStart, r.timeEnd, r.contactAddress,
          JSON.stringify(r.substitutions || []), r.status, r.currentApprovalStep, JSON.stringify(r.approvalHistory || []),
          r.attachmentUrl || '', r.attachmentName || '', r.createdAt, JSON.stringify(r.companions || []),
          r.vehicleType || '', r.vehiclePlate || '', r.goDistance || 0, r.returnDistance || 0, r.totalDistance || 0,
          r.totalCompensation || 0, r.driverName || '', r.budgetSource || '', r.claimAllowance ? 'TRUE' : 'FALSE',
          r.claimFuel ? 'TRUE' : 'FALSE', r.claimOther ? 'TRUE' : 'FALSE', r.isVehicleOnly ? 'TRUE' : 'FALSE'
        ])
      ]
    },
    {
      range: 'Vehicles!A1',
      values: [
        ['ID', 'RequestID', 'ApplicantName', 'Purpose', 'PassengerCount', 'Destination', 'DateStart', 'DateEnd', 'TimeStart', 'TimeEnd', 'VehicleType', 'DriverName', 'Status'],
        ...INITIAL_VEHICLE_BOOKINGS.map(v => [v.id, v.requestId || '', v.applicantName, v.purpose, v.passengerCount, v.destination, v.dateStart, v.dateEnd, v.timeStart, v.timeEnd, v.vehicleType, v.driverName, v.status])
      ]
    },
    {
      range: 'Buildings!A1',
      values: [
        ['ID', 'ApplicantName', 'BuildingName', 'Purpose', 'DateStart', 'TimeStart', 'TimeEnd', 'Status'],
        ...INITIAL_BUILDING_BOOKINGS.map(b => [b.id, b.applicantName, b.buildingName, b.purpose, b.dateStart, b.timeStart, b.timeEnd, b.status])
      ]
    },
    {
      range: 'Edoc!A1',
      values: [
        ['ID', 'RequestID', 'CommandNo', 'Title', 'TravelNamesJSON', 'DateStr', 'Location', 'GroupNotes', 'Status'],
        ...INITIAL_EDOCS.map(e => [e.id, e.requestId, e.commandNo, e.title, JSON.stringify(e.travelNames), e.dateStr, e.location, e.groupNotes, e.status])
      ]
    },
    {
      range: 'Certificates!A1',
      values: [
        ['ID', 'ApplicantName', 'RequestDate', 'Topic', 'CertCount', 'StartNo'],
        ...INITIAL_CERT_REQUESTS.map(c => [c.id, c.applicantName, c.requestDate, c.topic, c.certCount, c.startNo])
      ]
    }
  ];

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  const body = {
    valueInputOption: 'USER_ENTERED',
    data: valuesToSet.map(item => ({
      range: item.range,
      values: item.values
    }))
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    console.error('Error seeding spreadsheet:', await res.text());
  }
}

/**
 * Saves a single table completely by overwriting its spreadsheet tab.
 * This is incredibly reliable, self-healing, and prevents partial write bugs.
 */
export async function saveTableToSheet(
  accessToken: string,
  spreadsheetId: string,
  tableName: string,
  headers: string[],
  rows: any[][]
): Promise<boolean> {
  try {
    // Clear existing data first
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${tableName}!A:Z:clear`;
    await fetch(clearUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    // Write new data
    const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${tableName}!A1?valueInputOption=USER_ENTERED`;
    const payload = {
      range: `${tableName}!A1`,
      majorDimension: 'ROWS',
      values: [headers, ...rows]
    };

    const res = await fetch(writeUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.error(`Failed to save table ${tableName}:`, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Error saving table ${tableName} to Google Sheet:`, err);
    return false;
  }
}

/**
 * Fetches data for all tables from the Google Sheet and updates local state.
 */
export async function fetchAllTables(accessToken: string, spreadsheetId: string) {
  const tables = ['Users', 'Requests', 'DailyStats', 'Approvers', 'LeaveBalances', 'Vehicles', 'Buildings', 'Edoc', 'Certificates'];
  const ranges = tables.map(t => `${t}!A1:Z1000`).join('&ranges=');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=${ranges}`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch spreadsheet tables: ${await res.text()}`);
  }

  const data = await res.json();
  const valueRanges = data.valueRanges || [];
  
  const parsed: any = {};
  
  tables.forEach((table, index) => {
    const valueRange = valueRanges[index] || {};
    const rows = valueRange.values || [];
    if (rows.length === 0) {
      parsed[table] = [];
      return;
    }
    
    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    parsed[table] = dataRows.map((row: any[]) => {
      const item: any = {};
      headers.forEach((header: string, hIndex: number) => {
        item[header] = row[hIndex] !== undefined ? row[hIndex] : '';
      });
      return item;
    });
  });

  // Convert the sheet raw objects back to typed structures
  const users: User[] = parsed.Users.map((u: any) => ({
    id: u.ID,
    name: u.Name,
    pin: u.PIN,
    position: u.Position,
    group: u.Group,
    tel: u.Tel,
    email: u.Email,
    createdAt: u.CreatedAt
  }));

  const requests: RequestItem[] = parsed.Requests.map((r: any) => {
    let subs = [];
    try { subs = r.SubstitutionsJSON ? JSON.parse(r.SubstitutionsJSON) : []; } catch(e) {}
    let hist = [];
    try { hist = r.ApprovalHistoryJSON ? JSON.parse(r.ApprovalHistoryJSON) : []; } catch(e) {}
    let comps = [];
    try { comps = r.CompanionsJSON ? JSON.parse(r.CompanionsJSON) : []; } catch(e) {}

    return {
      id: r.ID,
      type: r.Type,
      applicantName: r.ApplicantName,
      applicantTel: r.ApplicantTel,
      applicantPosition: r.ApplicantPosition,
      applicantGroup: r.ApplicantGroup,
      reason: r.Reason,
      dateStart: r.DateStart,
      dateEnd: r.DateEnd,
      timeStart: r.TimeStart,
      timeEnd: r.TimeEnd,
      contactAddress: r.ContactAddress,
      substitutions: subs,
      status: r.Status || 'pending',
      currentApprovalStep: parseInt(r.CurrentApprovalStep || '1'),
      approvalHistory: hist,
      attachmentUrl: r.AttachmentUrl || undefined,
      attachmentName: r.AttachmentName || undefined,
      createdAt: r.CreatedAt,
      companions: comps,
      vehicleType: r.VehicleType || undefined,
      vehiclePlate: r.VehiclePlate || undefined,
      goDistance: parseFloat(r.GoDistance || '0'),
      returnDistance: parseFloat(r.ReturnDistance || '0'),
      totalDistance: parseFloat(r.TotalDistance || '0'),
      totalCompensation: parseFloat(r.TotalCompensation || '0'),
      driverName: r.DriverName || undefined,
      budgetSource: r.BudgetSource || undefined,
      claimAllowance: r.ClaimAllowance === 'TRUE',
      claimFuel: r.ClaimFuel === 'TRUE',
      claimOther: r.ClaimOther === 'TRUE',
      isVehicleOnly: r.IsVehicleOnly === 'TRUE'
    };
  });

  const dailyStats: DailyStat[] = parsed.DailyStats.map((s: any) => {
    let details = { sick: [], personal: [], travel: [] };
    try { details = s.DetailsJSON ? JSON.parse(s.DetailsJSON) : details; } catch(e) {}
    return {
      group: s.Group,
      date: s.Date,
      presentCount: parseInt(s.PresentCount || '0'),
      absentCount: parseInt(s.AbsentCount || '0'),
      details
    };
  });

  const approverRoles: ApproverRole[] = parsed.Approvers.map((a: any) => ({
    roleId: a.RoleID,
    assignedUserName: a.AssignedUserName
  }));

  const leaveBalances: LeaveBalance[] = parsed.LeaveBalances.map((l: any) => ({
    userName: l.UserName,
    sickDays: parseInt(l.SickDays || '0'),
    personalDays: parseInt(l.PersonalDays || '0'),
    otherDays: parseInt(l.OtherDays || '0')
  }));

  const vehicles: VehicleBooking[] = parsed.Vehicles.map((v: any) => ({
    id: v.ID,
    requestId: v.RequestID || undefined,
    applicantName: v.ApplicantName,
    purpose: v.Purpose,
    passengerCount: parseInt(v.PassengerCount || '0'),
    destination: v.Destination,
    dateStart: v.DateStart,
    dateEnd: v.DateEnd,
    timeStart: v.TimeStart,
    timeEnd: v.TimeEnd,
    vehicleType: v.VehicleType,
    driverName: v.DriverName,
    status: v.Status || 'pending'
  }));

  const buildings: BuildingBooking[] = parsed.Buildings.map((b: any) => ({
    id: b.ID,
    applicantName: b.ApplicantName,
    buildingName: b.BuildingName,
    purpose: b.Purpose,
    dateStart: b.DateStart,
    timeStart: b.TimeStart,
    timeEnd: b.TimeEnd,
    status: b.Status || 'pending'
  }));

  const edocs: EdocOrder[] = parsed.Edoc.map((e: any) => {
    let travelNames = [];
    try { travelNames = e.TravelNamesJSON ? JSON.parse(e.TravelNamesJSON) : []; } catch(e) {}
    return {
      id: e.ID,
      requestId: e.RequestID,
      commandNo: e.CommandNo,
      title: e.Title,
      travelNames,
      dateStr: e.DateStr,
      location: e.Location,
      groupNotes: e.GroupNotes,
      status: e.Status || 'รอดำเนินการ'
    };
  });

  const certs: CertificateRequest[] = parsed.Certificates.map((c: any) => ({
    id: c.ID,
    applicantName: c.ApplicantName,
    requestDate: c.RequestDate,
    topic: c.Topic,
    certCount: parseInt(c.CertCount || '0'),
    startNo: parseInt(c.StartNo || '0')
  }));

  return {
    users,
    requests,
    dailyStats,
    approverRoles,
    leaveBalances,
    vehicles,
    buildings,
    edocs,
    certs
  };
}
