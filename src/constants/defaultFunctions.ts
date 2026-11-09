import { FunctionTemplateItem } from '../types/ide';

export const DEFAULT_FUNCTION_TEMPLATES: FunctionTemplateItem[] = [
  // =========================================================
  // 1. ENCODER MOVEMENT (เดินหน้า/ถอยหลังด้วย Encoder)
  // =========================================================
  {
    id: 'cmd_ffe',
    name: 'FFE',
    category: 'encoder',
    categoryLabel: 'Encoder เดินหน้า',
    description: 'เดินหน้าด้วย Encoder พร้อมทางเลือกเลี้ยวและปรับ Ramp',
    exampleCall: "FFE(100, 400, 'R');",
    params: [
      { name: 'speed', type: 'number', placeholder: '100', defaultValue: '100', description: 'ความเร็ว (1-100)' },
      { name: 'distance', type: 'number', placeholder: '400', defaultValue: '400', description: 'ระยะทาง Encoder' },
      {
        name: 'turn',
        type: 'select',
        placeholder: 'ไม่หมุน',
        description: 'หมุนหลังเดินเสร็จ',
        options: ['', "'L'", "'R'", "'l'", "'r'"],
      },
      { name: 'ramp_up', type: 'number', placeholder: '200', description: 'เวลาเร่ง Ramp Up (ms) [เว้นว่างได้]' },
      { name: 'ramp_down', type: 'number', placeholder: '50', description: 'ระยะชะลอ Ramp Down [เว้นว่างได้]' },
    ],
  },
  {
    id: 'cmd_bbe',
    name: 'BBE',
    category: 'encoder',
    categoryLabel: 'Encoder ถอยหลัง',
    description: 'ถอยหลังด้วย Encoder พร้อมทางเลือกเลี้ยวและปรับ Ramp',
    exampleCall: "BBE(100, 400, 'L');",
    params: [
      { name: 'speed', type: 'number', placeholder: '100', defaultValue: '100', description: 'ความเร็ว (1-100)' },
      { name: 'distance', type: 'number', placeholder: '400', defaultValue: '400', description: 'ระยะทาง Encoder' },
      {
        name: 'turn',
        type: 'select',
        placeholder: 'ไม่หมุน',
        description: 'หมุนหลังถอยเสร็จ',
        options: ['', "'L'", "'R'", "'l'", "'r'"],
      },
      { name: 'ramp_up', type: 'number', placeholder: '200', description: 'เวลาเร่ง Ramp Up (ms) [เว้นว่างได้]' },
      { name: 'ramp_down', type: 'number', placeholder: '50', description: 'ระยะชะลอ Ramp Down [เว้นว่างได้]' },
    ],
  },
  {
    id: 'cmd_ffe_turn',
    name: 'FFE_turn',
    category: 'encoder',
    categoryLabel: 'Encoder ก่อน Turn',
    description: 'เดินหน้าระยะสั้นก่อนเข้า Turn (ไม่มี Ramp)',
    exampleCall: "FFE_turn(100, 100, 'R');",
    params: [
      { name: 'speed', type: 'number', placeholder: '100', defaultValue: '100', description: 'ความเร็ว' },
      { name: 'distance', type: 'number', placeholder: '100', defaultValue: '100', description: 'ระยะทาง' },
      {
        name: 'turn',
        type: 'select',
        placeholder: 'ไม่หมุน',
        description: 'Turn เลี้ยว',
        options: ['', "'L'", "'R'", "'l'", "'r'"],
      },
      { name: 'ramp_up', type: 'number', placeholder: '200', description: 'Ramp Up (ms) [เว้นว่างได้]' },
      { name: 'ramp_down', type: 'number', placeholder: '50', description: 'Ramp Down [เว้นว่างได้]' },
    ],
  },
  {
    id: 'cmd_bbe_turn',
    name: 'BBE_turn',
    category: 'encoder',
    categoryLabel: 'Encoder ถอยก่อน Turn',
    description: 'ถอยหลังระยะสั้นก่อนเข้า Turn (ไม่มี Ramp)',
    exampleCall: "BBE_turn(100, 100, 'L');",
    params: [
      { name: 'speed', type: 'number', placeholder: '100', defaultValue: '100', description: 'ความเร็ว' },
      { name: 'distance', type: 'number', placeholder: '100', defaultValue: '100', description: 'ระยะทาง' },
      {
        name: 'turn',
        type: 'select',
        placeholder: 'ไม่หมุน',
        description: 'Turn เลี้ยว',
        options: ['', "'L'", "'R'", "'l'", "'r'"],
      },
      { name: 'ramp_up', type: 'number', placeholder: '200', description: 'Ramp Up (ms) [เว้นว่างได้]' },
      { name: 'ramp_down', type: 'number', placeholder: '50', description: 'Ramp Down [เว้นว่างได้]' },
    ],
  },

  // =========================================================
  // 2. GYRO & SPIN (หมุนตัว & เลี้ยวด้วยไจโร)
  // =========================================================
  {
    id: 'cmd_spindegree',
    name: 'spinDegree',
    category: 'gyro',
    categoryLabel: 'หมุนอยู่กับที่',
    description: 'หมุนตัวอยู่กับที่ด้วยไจโร (-90=ซ้าย 90°, 90=ขวา 90°, -45=ซ้าย 45°, 45=ขวา 45°)',
    exampleCall: 'spinDegree(90);',
    params: [
      { name: 'relative_degree', type: 'number', placeholder: '90', defaultValue: '90', description: 'องศา (-90, 90, -45, 45)' },
      { name: 'threshold', type: 'number', placeholder: '20', description: 'ความคลาดเคลื่อนที่ยอมรับได้ [เว้นว่างได้]' },
    ],
  },
  {
    id: 'cmd_turndegreefront',
    name: 'turnDegreeFront',
    category: 'gyro',
    categoryLabel: 'เดินหน้าเลี้ยว',
    description: 'เดินหน้าเลี้ยวตามองศาไจโร (-90=ซ้าย 90°, 90=ขวา 90°)',
    exampleCall: 'turnDegreeFront(90);',
    params: [
      { name: 'relative_degree', type: 'number', placeholder: '90', defaultValue: '90', description: 'องศา' },
      { name: 'threshold', type: 'number', placeholder: '50', description: 'ความคลาดเคลื่อน [เว้นว่างได้]' },
    ],
  },
  {
    id: 'cmd_turndegreeback',
    name: 'turnDegreeBack',
    category: 'gyro',
    categoryLabel: 'ถอยหลังเลี้ยว',
    description: 'ถอยหลังเลี้ยวตามองศาไจโร (-90=ซ้าย 90°, 90=ขวา 90°)',
    exampleCall: 'turnDegreeBack(-90);',
    params: [
      { name: 'relative_degree', type: 'number', placeholder: '-90', defaultValue: '-90', description: 'องศา' },
      { name: 'threshold', type: 'number', placeholder: '50', description: 'ความคลาดเคลื่อน [เว้นว่างได้]' },
    ],
  },

  // =========================================================
  // 3. LINE ALIGNMENT (จัดตำแหน่งหุ่นกับเส้น)
  // =========================================================
  {
    id: 'cmd_setfront',
    name: 'SetFront',
    category: 'line',
    categoryLabel: 'จัดหน้าเข้าเส้น',
    description: 'หน้าหุ่นเข้าหาเส้น (หยุดเมื่อตรงเส้น / ถอยออก / หมุน)',
    exampleCall: "SetFront(20, 150, 'R');",
    params: [
      { name: 'speed', type: 'number', placeholder: '20', defaultValue: '20', description: 'ความเร็วเข้าหาเส้น' },
      { name: 'target', type: 'number', placeholder: '150', description: 'ระยะถอยหลังออก [เว้นว่างได้]' },
      {
        name: 'turn',
        type: 'select',
        placeholder: 'ไม่หมุน',
        description: 'หมุนหลังถอย',
        options: ['', "'L'", "'R'"],
      },
    ],
  },
  {
    id: 'cmd_setback',
    name: 'SetBack',
    category: 'line',
    categoryLabel: 'จัดหลังเข้าเส้น',
    description: 'หลังหุ่นเข้าหาเส้น (หยุดเมื่อตรงเส้น / เดินหน้าออก / หมุน)',
    exampleCall: "SetBack(20, 150, 'L');",
    params: [
      { name: 'speed', type: 'number', placeholder: '20', defaultValue: '20', description: 'ความเร็วเข้าหาเส้น' },
      { name: 'target', type: 'number', placeholder: '150', description: 'ระยะเดินหน้าออก [เว้นว่างได้]' },
      {
        name: 'turn',
        type: 'select',
        placeholder: 'ไม่หมุน',
        description: 'หมุนหลังเดินหน้า',
        options: ['', "'L'", "'R'"],
      },
    ],
  },
  {
    id: 'cmd_setfront_time',
    name: 'SetFront_time',
    category: 'line',
    categoryLabel: 'จัดหน้าใช้เวลา',
    description: 'จัดหน้าหุ่นเข้าหาเส้นแล้วถอยตามเวลา (มิลลิวินาที)',
    exampleCall: "SetFront_time(20, 150, 'R');",
    params: [
      { name: 'speed', type: 'number', placeholder: '20', defaultValue: '20', description: 'ความเร็ว' },
      { name: 'target_ms', type: 'number', placeholder: '150', defaultValue: '150', description: 'เวลาถอย (ms)' },
      {
        name: 'turn',
        type: 'select',
        placeholder: 'ไม่หมุน',
        description: 'หมุนหลังถอย',
        options: ['', "'L'", "'R'"],
      },
    ],
  },
  {
    id: 'cmd_setback_time',
    name: 'SetBack_time',
    category: 'line',
    categoryLabel: 'จัดหลังใช้เวลา',
    description: 'จัดหลังหุ่นเข้าหาเส้นแล้วเดินหน้าตามเวลา (มิลลิวินาที)',
    exampleCall: "SetBack_time(20, 150, 'L');",
    params: [
      { name: 'speed', type: 'number', placeholder: '20', defaultValue: '20', description: 'ความเร็ว' },
      { name: 'target_ms', type: 'number', placeholder: '150', defaultValue: '150', description: 'เวลาเดินหน้า (ms)' },
      {
        name: 'turn',
        type: 'select',
        placeholder: 'ไม่หมุน',
        description: 'หมุนหลังเดิน',
        options: ['', "'L'", "'R'"],
      },
    ],
  },

  // =========================================================
  // 4. PAYLOAD & SERVO (ปล่อยถุงยังชีพ & เซอร์โว)
  // =========================================================
  {
    id: 'cmd_dropf',
    name: 'DropF',
    category: 'servo',
    categoryLabel: 'ปล่อยถุงด้านหน้า',
    description: 'ปล่อยถุงยังชีพด้านหน้า (DROP -> ดีเลย์ -> LOCK อัตโนมัติ)',
    exampleCall: 'DropF(20);',
    params: [
      { name: 'speed', type: 'number', placeholder: '20', description: 'ความเร็วจัดเส้นก่อนทิ้ง [เว้นว่างเพื่อทิ้งทันที]' },
    ],
  },
  {
    id: 'cmd_dropb',
    name: 'DropB',
    category: 'servo',
    categoryLabel: 'ปล่อยถุงด้านหลัง',
    description: 'ปล่อยถุงยังชีพด้านหลัง (DROP -> ดีเลย์ -> LOCK อัตโนมัติ)',
    exampleCall: 'DropB(20);',
    params: [
      { name: 'speed', type: 'number', placeholder: '20', description: 'ความเร็วจัดเส้นก่อนทิ้ง [เว้นว่างเพื่อทิ้งทันที]' },
    ],
  },
  {
    id: 'cmd_servowrite',
    name: 'servoWrite',
    category: 'servo',
    categoryLabel: 'ควบคุมเซอร์โว',
    description: 'สั่งงานเซอร์โวโดยตรง (ช่อง 0-6 หรือ FRONT_SERVO / BACK_SERVO)',
    exampleCall: 'servoWrite(FRONT_SERVO, FrontServo_Drop);',
    params: [
      { name: 'channel', type: 'text', placeholder: 'FRONT_SERVO', defaultValue: 'FRONT_SERVO', description: 'ช่องเซอร์โว' },
      { name: 'degree', type: 'text', placeholder: 'FrontServo_Drop', defaultValue: 'FrontServo_Drop', description: 'องศา (0-180)' },
    ],
  },

  // =========================================================
  // 5. TIME MOVEMENT (วิ่งแบบจับเวลา)
  // =========================================================
  {
    id: 'cmd_ff',
    name: 'FF',
    category: 'time',
    categoryLabel: 'เดินหน้าจับเวลา',
    description: 'เดินหน้าด้วยความเร็วตามเวลา (มิลลิวินาที) พร้อมทางเลือกหมุน',
    exampleCall: "FF(50, 500, 'R');",
    params: [
      { name: 'speed', type: 'number', placeholder: '50', defaultValue: '50', description: 'ความเร็ว' },
      { name: 'timer', type: 'number', placeholder: '500', defaultValue: '500', description: 'เวลา (ms)' },
      {
        name: 'turn',
        type: 'select',
        placeholder: 'ไม่หมุน',
        description: 'หมุนหลังเดิน',
        options: ['', "'L'", "'R'", "'l'", "'r'"],
      },
    ],
  },
  {
    id: 'cmd_bb',
    name: 'BB',
    category: 'time',
    categoryLabel: 'ถอยหลังจับเวลา',
    description: 'ถอยหลังด้วยความเร็วตามเวลา (มิลลิวินาที) พร้อมทางเลือกหมุน',
    exampleCall: "BB(50, 500, 'L');",
    params: [
      { name: 'speed', type: 'number', placeholder: '50', defaultValue: '50', description: 'ความเร็ว' },
      { name: 'timer', type: 'number', placeholder: '500', defaultValue: '500', description: 'เวลา (ms)' },
      {
        name: 'turn',
        type: 'select',
        placeholder: 'ไม่หมุน',
        description: 'หมุนหลังถอย',
        options: ['', "'L'", "'R'", "'l'", "'r'"],
      },
    ],
  },

  // =========================================================
  // 6. MOTOR & SYSTEM (มอเตอร์ & คำสั่งระบบ)
  // =========================================================
  {
    id: 'cmd_stop',
    name: 'STOP',
    category: 'motor',
    categoryLabel: 'หยุดรอปุ่มกด',
    description: 'สั่งหยุดมอเตอร์และรอกดปุ่ม A หรือ B เพื่อทำงานต่อ',
    exampleCall: 'STOP();',
    params: [],
  },
  {
    id: 'cmd_wait_start',
    name: 'wait_start',
    category: 'motor',
    categoryLabel: 'รอเริ่มภารกิจ',
    description: 'ส่งเสียงบัสเซอร์และรอให้กดปุ่ม A หรือ B บนบอร์ดเพื่อเริ่มภารกิจ',
    exampleCall: 'wait_start();',
    params: [],
  },
  {
    id: 'cmd_motorwrite',
    name: 'motorWrite',
    category: 'motor',
    categoryLabel: 'สั่งมอเตอร์ 4 ตัว',
    description: 'สั่งงานความเร็วมอเตอร์พร้อมกัน 4 ช่อง (-100 ถึง 100)',
    exampleCall: 'motorWrite(50, 50, 50, 50);',
    params: [
      { name: 'm1', type: 'number', placeholder: '50', defaultValue: '50', description: 'มอเตอร์ 1 (ซ้ายหน้า)' },
      { name: 'm2', type: 'number', placeholder: '50', defaultValue: '50', description: 'มอเตอร์ 2 (ซ้ายหลัง)' },
      { name: 'm3', type: 'number', placeholder: '50', defaultValue: '50', description: 'มอเตอร์ 3 (ขวาหน้า)' },
      { name: 'm4', type: 'number', placeholder: '50', defaultValue: '50', description: 'มอเตอร์ 4 (ขวาหลัง)' },
    ],
  },
  {
    id: 'cmd_motorstop',
    name: 'motorStop',
    category: 'motor',
    categoryLabel: 'หยุดมอเตอร์',
    description: 'สั่งหยุดมอเตอร์ทั้งหมดทันที',
    exampleCall: 'motorStop();',
    params: [],
  },
  {
    id: 'cmd_beep',
    name: 'beep',
    category: 'motor',
    categoryLabel: 'ส่งเสียงเตือน',
    description: 'สั่งงานบัสเซอร์ส่งเสียง (มิลลิวินาที)',
    exampleCall: 'beep(50);',
    params: [
      { name: 'duration_ms', type: 'number', placeholder: '50', defaultValue: '50', description: 'ระยะเวลา (ms)' },
    ],
  },
  {
    id: 'cmd_delay',
    name: 'delay',
    category: 'motor',
    categoryLabel: 'หน่วงเวลา',
    description: 'หยุดรอเวลาเป็นมิลลิวินาที',
    exampleCall: 'delay(500);',
    params: [
      { name: 'ms', type: 'number', placeholder: '500', defaultValue: '500', description: 'มิลลิวินาที' },
    ],
  },
];
