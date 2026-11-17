# การตรวจสอบและผลทดสอบ

## ผลที่ตรวจได้ในสภาพแวดล้อมที่สร้างงาน

- การรันหลัก: Docker Desktop, Node.js 24.22.3 ใน container และ MySQL Community Server 8.4.13
- ตรวจ syntax ของ JavaScript ฝั่ง server, API, UI และ API explorer
- HTTP integration tests บน **MySQL จริงผ่าน 20/20 กลุ่ม** ในฐาน `village_test` แยก container จากฐานเว็บหลัก
- ตรวจ information_schema: 13 ตารางในฐาน `village_portal` ใช้ InnoDB ทั้งหมด
- เว็บและ MySQL container ขึ้น healthy; `/api/v1/health` ส่ง database=mysql
- ทดสอบเข้าสู่ระบบและเปิด Dashboard ผ่านเบราว์เซอร์บน Docker สำเร็จ
- ผล SQLite 20/20 เป็นผล regression จากรอบก่อนหน้า ไม่ใช่ฐานข้อมูลหลักของเว็บ
- ผล MySQL ล่าสุดอยู่ใน `test-results-mysql.txt`: pass 20 / fail 0; ผล SQLite เดิมอยู่ใน `test-results.txt`
- เปิดเบราว์เซอร์ที่ localhost และเข้าสู่ระบบลูกบ้านสำเร็จ
- ตรวจ Dashboard, หน้าอุปกรณ์, ฟอร์มยืม, สร้างรายการยืมจริง แล้วเห็นจำนวนพร้อมยืมลดลง
- ตรวจเมนูมือถือที่ viewport 390×844, หน้าอุปกรณ์ไม่มี overflow แนวนอน, รายละเอียดเรื่องและ timeline บนมือถือ
- เปิดรายละเอียดเรื่อง เห็นประวัติและความคิดเห็นจากฐานข้อมูล
- บันทึกภาพหน้าแดชบอร์ดจริงเป็นภาพตัวอย่างที่ส่งแยกมากับ ZIP
- สร้าง lockfile และ npm audit ขณะติดตั้ง metadata ไม่พบช่องโหว่ที่รายงาน ณ เวลารัน ไม่ใช่การรับรองความปลอดภัยทั้งหมด

## กลุ่มทดสอบอัตโนมัติ

1. health, static assets และ OpenAPI มี 55 endpoints
2. API ส่วนตัวปฏิเสธ anonymous และ JWT ที่ถูกแก้ไข
3. Cookie มี HttpOnly/SameSite และไม่ส่ง password hash กลับ
4. resident เข้า staff/admin ไม่ได้ และส่ง role=admin ตอนสมัครก็ยังได้ resident
5. วงจรโพสต์: สร้าง แก้ไขเจ้าของ อัปเดตสถานะ ประวัติ ความคิดเห็น และ cascade delete
6. ค้นหา filter pagination, รับ SQL injection เป็นข้อความ และ validate ข้อมูล
7. ยืมพร้อมกันหนึ่งชิ้น, สต็อกไม่ติดลบ, เจ้าหน้าที่รับคืน, ปฏิเสธคืนซ้ำ
8. วันที่คืน/จำนวนที่ไม่ถูกต้องไม่ทำให้สต็อกเปลี่ยน
9. กิจกรรมมีที่นั่งหนึ่งที่ ไม่รับเกินเมื่อสมัครพร้อมกัน
10. ประกาศ staff CRUD และ pin; resident สร้างไม่ได้
11. แจ้งเตือนส่วนตัวและ read-all ตามเจ้าของ
12. CSV export ป้องกันเซลล์ที่ถูกตีความเป็นสูตร
13. เปลี่ยนบทบาท/active เพิกถอน token เก่า และป้องกัน Admin ปิดตนเอง
14. เปลี่ยนรหัสผ่านต้องผ่านรหัสเดิมและเพิกถอน token
15. logout ทำให้ Bearer token เดิมใช้ต่อไม่ได้
16. ปฏิเสธ cross-origin writes, JSON ผิดรูปแบบ, content type ผิดและ body เกินขนาด
17. categories CRUD ใช้ generated ID และไม่ลบหมวดที่มีเรื่องอ้างอิง
18. แก้จำนวนอุปกรณ์โดยคงยอดที่ถูกยืม และไม่ลดต่ำกว่าจำนวนยืมอยู่
19. แก้กิจกรรม สมัครซ้ำ ถอนสมัคร และจำนวนสมาชิก
20. แก้ profile, ความเป็นส่วนตัวรายการยืม, aggregate reports และข้อมูลผู้ใช้

## สิ่งที่ยังไม่ได้ยืนยัน

ทดสอบ MySQL ใน Docker จริงแล้วตามผลด้านบน ใช้ compose.test.yml กับ temporary database แยก จบแล้วนำเฉพาะ container ทดสอบออก เว็บหลักยังทำงานและข้อมูลหลักคงอยู่ GitHub Actions เตรียมไว้แต่ไม่ได้อ้างว่าได้รันบน GitHub แล้ว

ไม่ได้วัด throughput/load, accessibility ด้วย screen reader จริง, email/SMS delivery หรือทดสอบ penetration ภายนอก ยังไม่ได้ทดสอบทุกหน้าจอครบทุกบทบาทผ่านเบราว์เซอร์ แต่สิทธิ์สำคัญและ workflow หลักตรวจด้วย HTTP tests

## ตรวจระบบ MySQL ด้วยตนเอง

1. เปิด Docker Desktop แล้วรัน START-DOCKER.cmd ตาม README
2. ตรวจ `/api/v1/health` ต้องแสดง database = mysql
3. เปิด Workbench ดู 13 ตาราง FK, InnoDB, ENUM, JSON และ DATETIME
4. สร้างเรื่องใหม่ เปลี่ยนสถานะ และตรวจแถวใน post_history
5. ยืมและรับคืน ตรวจ loans กับ equipment
6. ถ้าจะรันชุดทดสอบใช้ฐานว่างชื่อลงท้าย `_test` โดยเฉพาะ ห้ามชี้ไปฐานใช้งานจริง
7. ดูผลทดสอบจริงใน test-results-mysql.txt หรือรัน compose.test.yml ใหม่ตาม README

## ตรวจด้วยตนเองบนหน้าเว็บ

| บทบาท/หน้า | รายการตรวจ |
|---|---|
| สมัคร/เข้าสู่ระบบ | invalid email, password สั้น, email ซ้ำ, รหัสผิด, logout |
| ลูกบ้าน/เรื่อง | สร้าง แก้ไขของตน กรอง mine ค้นหา ส่งความคิดเห็น |
| นิติบุคคล/เรื่อง | เปลี่ยนสถานะพร้อมหมายเหตุ ลูกบ้านได้รับแจ้งเตือน |
| อุปกรณ์ | ยืมเกินของคงเหลือไม่ได้ วันเก่าหรือเกิน 30 วันไม่ได้ |
| นิติบุคคล/คืน | รับคืนแล้วจำนวนเพิ่ม กดซ้ำไม่เพิ่มซ้ำ |
| กิจกรรม | เข้าร่วม ถอนสมัคร ดูเต็ม/หมดเวลา และรายชื่อ staff |
| Admin | เปลี่ยนบทบาท ระงับบัญชี ดู audit log |
| UI | 390px/720px/desktop, tab/shift-tab, Escape ปิด dialog, ข้อความไทยยาว |
| หลัง restart | ข้อมูลที่บันทึกยังอยู่ |
