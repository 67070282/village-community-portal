# API Reference

55 endpoints, ไม่นับ GET /api/v1/openapi.json. เอกสารแบบทดลองเรียกได้อยู่ที่ /docs หลังเปิดเซิร์ฟเวอร์

Public = ทั่วไป; Resident = สมาชิกที่ล็อกอินทุกบทบาท; Owner = เจ้าของรายการหรือ Admin; Staff = นิติบุคคลหรือ Admin; Admin = ผู้ดูแลระบบ

| # | Method | Path | สิทธิ์ | การทำงาน |
|---|---|---|---|---|
| 1 | GET | `/api/v1/health` | public | ตรวจสอบสถานะระบบ |
| 2 | POST | `/api/v1/auth/register` | public | สมัครสมาชิก (บทบาทลูกบ้านเท่านั้น) |
| 3 | POST | `/api/v1/auth/login` | public | เข้าสู่ระบบ รับ JWT และ HttpOnly cookie |
| 4 | POST | `/api/v1/auth/logout` | resident | ออกจากระบบและเพิกถอน JWT |
| 5 | GET | `/api/v1/auth/me` | resident | ข้อมูลผู้ใช้ปัจจุบัน |
| 6 | PATCH | `/api/v1/auth/me` | resident | แก้ไขข้อมูลส่วนตัว |
| 7 | PATCH | `/api/v1/auth/password` | resident | เปลี่ยนรหัสผ่านและเพิกถอนเซสชันทั้งหมด |
| 8 | GET | `/api/v1/categories` | resident | รายการหมวดหมู่ |
| 9 | POST | `/api/v1/categories` | admin | เพิ่มหมวดหมู่ |
| 10 | PATCH | `/api/v1/categories/:id` | admin | แก้ไขหมวดหมู่ |
| 11 | DELETE | `/api/v1/categories/:id` | admin | ลบหมวดหมู่ที่ยังไม่ถูกใช้ |
| 12 | GET | `/api/v1/posts` | resident | รายการโพสต์ ค้นหา/กรอง/แบ่งหน้า |
| 13 | GET | `/api/v1/posts/:id` | resident | รายละเอียดโพสต์ |
| 14 | POST | `/api/v1/posts` | resident | แจ้งปัญหาหรือประกาศของหาย |
| 15 | PATCH | `/api/v1/posts/:id` | owner | แก้ไขโพสต์ของตัวเองหรือโดย Admin |
| 16 | PATCH | `/api/v1/posts/:id/status` | staff | เปลี่ยนสถานะและบันทึกประวัติ |
| 17 | DELETE | `/api/v1/posts/:id` | owner | ลบโพสต์ของตัวเองหรือโดย Admin |
| 18 | GET | `/api/v1/posts/:id/history` | resident | ประวัติสถานะเรื่อง |
| 19 | GET | `/api/v1/posts/:id/comments` | resident | ความคิดเห็นของโพสต์ |
| 20 | POST | `/api/v1/posts/:id/comments` | resident | เพิ่มความคิดเห็น |
| 21 | DELETE | `/api/v1/comments/:id` | owner | ลบความคิดเห็นของตัวเองหรือโดย Admin |
| 22 | GET | `/api/v1/equipment` | resident | รายการและจำนวนอุปกรณ์พร้อมยืม |
| 23 | GET | `/api/v1/equipment/:id` | resident | รายละเอียดอุปกรณ์ |
| 24 | POST | `/api/v1/equipment` | staff | เพิ่มอุปกรณ์ส่วนกลาง |
| 25 | PATCH | `/api/v1/equipment/:id` | staff | แก้ไขอุปกรณ์และสต็อกอย่างปลอดภัย |
| 26 | DELETE | `/api/v1/equipment/:id` | staff | ปิดใช้งานอุปกรณ์ที่ไม่มีรายการค้างคืน |
| 27 | GET | `/api/v1/loans` | resident | รายการยืมของฉัน / ทั้งหมดสำหรับเจ้าหน้าที่ |
| 28 | GET | `/api/v1/loans/:id` | resident | รายละเอียดการยืมตามสิทธิ์ |
| 29 | POST | `/api/v1/loans` | resident | ยืมอุปกรณ์พร้อมตัดสต็อกใน Transaction |
| 30 | PATCH | `/api/v1/loans/:id/return` | staff | เจ้าหน้าที่รับคืนและเพิ่มสต็อกใน Transaction |
| 31 | GET | `/api/v1/announcements` | resident | ข่าวประกาศ (ปักหมุดก่อน) |
| 32 | GET | `/api/v1/announcements/:id` | resident | รายละเอียดประกาศ |
| 33 | POST | `/api/v1/announcements` | staff | สร้างประกาศชุมชน |
| 34 | PATCH | `/api/v1/announcements/:id` | staff | แก้ไขหรือปักหมุดประกาศ |
| 35 | DELETE | `/api/v1/announcements/:id` | staff | ลบประกาศ |
| 36 | GET | `/api/v1/events` | resident | รายการกิจกรรมและจำนวนผู้เข้าร่วม |
| 37 | GET | `/api/v1/events/:id` | resident | รายละเอียดกิจกรรม |
| 38 | POST | `/api/v1/events` | staff | สร้างกิจกรรมชุมชน |
| 39 | PATCH | `/api/v1/events/:id` | staff | แก้ไขกิจกรรมโดยไม่ลดที่นั่งต่ำกว่าผู้สมัคร |
| 40 | DELETE | `/api/v1/events/:id` | staff | ยกเลิกกิจกรรมและแจ้งผู้เข้าร่วม |
| 41 | POST | `/api/v1/events/:id/join` | resident | เข้าร่วมกิจกรรมพร้อมตรวจที่ว่าง |
| 42 | DELETE | `/api/v1/events/:id/join` | resident | ยกเลิกการเข้าร่วมกิจกรรม |
| 43 | GET | `/api/v1/events/:id/attendees` | staff | รายชื่อผู้เข้าร่วม (เจ้าหน้าที่) |
| 44 | GET | `/api/v1/notifications` | resident | การแจ้งเตือนส่วนตัว |
| 45 | PATCH | `/api/v1/notifications/read-all` | resident | อ่านการแจ้งเตือนทั้งหมด |
| 46 | PATCH | `/api/v1/notifications/:id/read` | resident | อ่านการแจ้งเตือนส่วนตัว |
| 47 | DELETE | `/api/v1/notifications/:id` | resident | ลบการแจ้งเตือนส่วนตัว |
| 48 | GET | `/api/v1/dashboard` | resident | ภาพรวมชุมชนและรายการของฉัน |
| 49 | GET | `/api/v1/reports/summary` | staff | สถิติแยกหมวดหมู่และสัดส่วนแก้ไข |
| 50 | GET | `/api/v1/reports/export` | staff | ส่งออกรายงานเป็น CSV (ป้องกันสูตรอันตราย) |
| 51 | GET | `/api/v1/users` | admin | รายชื่อผู้ใช้ (เฉพาะ Admin) |
| 52 | GET | `/api/v1/users/:id` | admin | ข้อมูลผู้ใช้ (เฉพาะ Admin) |
| 53 | PATCH | `/api/v1/users/:id/role` | admin | เปลี่ยนบทบาทและเพิกถอนเซสชันเดิม |
| 54 | PATCH | `/api/v1/users/:id/active` | admin | เปิด/ปิดบัญชีและเพิกถอนเซสชัน |
| 55 | GET | `/api/v1/audit-logs` | admin | บันทึกการดำเนินงานเพื่อความโปร่งใส |

## Response format

```json
{"data": {"example": "result"}}
{"error": {"code": "FORBIDDEN", "message": "เฉพาะผู้ดูแลระบบ"}}
```

GET /posts, /loans, /users, /audit-logs คืน {items,total,limit,offset} ใน data; limit สูงสุด 100. /posts รองรับ q, type, category, status, mine.

POST สร้างทรัพยากรคืน 201; login/logout คืน 200; PATCH/GET คืน 200; DELETE คืน 204 ไม่มี body. ข้อผิดพลาด 400/401/403/404/409/413/415/422/429.

JWT รับจาก POST /auth/login ใช้ Authorization: Bearer <token> หรือ HttpOnly cookie. Token อายุ 8 ชั่วโมง; logout/เปลี่ยนรหัสผ่าน/เปลี่ยนบทบาท/ระงับบัญชีเพิกถอนได้จริง.

ตัวอย่าง request body ดู openapi.json หรือ Postman collection; แทน :id ด้วยรหัสจริงจาก response ไม่ใช่เลขลำดับรายการ.