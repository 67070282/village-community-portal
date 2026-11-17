import { db, transaction } from "./db.js";
import { hashPassword, now, id } from "./security.js";
export const demoPassword = "Village@123";
export async function seed() {
  if (await db.get("SELECT users_id FROM users LIMIT 1")) return;
  if (
    process.env.SEED_DEMO === "false" ||
    process.env.NODE_ENV === "production"
  )
    return;
  const date = (days, hours = 0) =>
    new Date(Date.now() + days * 86400000 + hours * 3600000).toISOString();
  await transaction(async (tx) => {
    const users = [
      [
        "resident-demo",
        "พิมพ์ชนก ใจดี",
        "resident@village.demo",
        "88/12",
        "0812345678",
        "resident",
      ],
      [
        "juristic-demo",
        "คุณธนา ฝ่ายนิติบุคคล",
        "juristic@village.demo",
        "สำนักงาน",
        "0823456789",
        "juristic",
      ],
      [
        "admin-demo",
        "ผู้ดูแลระบบ",
        "admin@village.demo",
        "สำนักงาน",
        "0834567890",
        "admin",
      ],
      [
        "neighbor-demo",
        "กิตติ เพื่อนบ้าน",
        "neighbor@village.demo",
        "88/24",
        "0845678901",
        "resident",
      ],
    ];
    const password = hashPassword(demoPassword);
    for (const [uid, name, email, house, phone, role] of users)
      await tx.run(
        "INSERT INTO users (users_id,full_name,email,password_hash,house_number,phone,role,active,created_at) VALUES (?,?,?,?,?,?,?,1,?)",
        [uid, name, email, password, house, phone, role, date(-30)],
      );
    for (const c of [
      [1, "ไฟฟ้าและแสงสว่าง", "issue", "ไฟดับ ไฟทางชำรุด"],
      [2, "ถนนและพื้นที่ส่วนกลาง", "issue", "ถนน น้ำท่วม ต้นไม้"],
      [3, "เสียงและความปลอดภัย", "issue", "เสียงดัง ความปลอดภัย"],
      [4, "สัตว์เลี้ยงหาย", "lost", "ประกาศตามหาสัตว์เลี้ยง"],
      [5, "ของหาย / เก็บของได้", "lost", "ตามหาและส่งคืนของ"],
      [6, "การยืมอุปกรณ์", "equipment", "บริการอุปกรณ์ส่วนกลาง"],
    ])
      await tx.run("INSERT INTO categories VALUES (?,?,?,?)", c);
    const posts = [
      [
        "post-1",
        "resident-demo",
        1,
        "ไฟส่องสว่างหน้าสวนส่วนกลางไม่ติด",
        "ไฟทางบริเวณทางเดินเข้าสวนไม่ติด 2 ดวง ช่วงกลางคืนค่อนข้างมืด รบกวนตรวจสอบเพื่อความปลอดภัยค่ะ",
        "สวนส่วนกลาง โซน A",
        "in_progress",
        "high",
        -2,
      ],
      [
        "post-2",
        "neighbor-demo",
        4,
        "ตามหาน้องส้ม แมวสีส้ม ใส่ปลอกคอสีฟ้า",
        "น้องหลุดออกจากบ้านเมื่อช่วงเช้า หากพบเห็นบริเวณสวนหรือคลับเฮาส์ กรุณาแจ้งผ่านความคิดเห็น ขอบคุณทุกคนที่ช่วยตามหาค่ะ",
        "ซอย 4 ใกล้คลับเฮาส์",
        "pending",
        "normal",
        -1,
      ],
      [
        "post-3",
        "neighbor-demo",
        2,
        "ฝาท่อระบายน้ำชำรุดบริเวณซอย 3",
        "ฝาท่อแตกร้าว มีจุดที่อาจสะดุดล้ม กรุณาตรวจสอบและกั้นพื้นที่ระหว่างรอซ่อม",
        "ซอย 3 หน้าบ้าน 88/36",
        "pending",
        "high",
        0,
      ],
      [
        "post-4",
        "resident-demo",
        5,
        "เก็บกุญแจรถได้ที่สนามเด็กเล่น",
        "พบกุญแจรถพร้อมพวงกุญแจสีแดง ฝากไว้กับเจ้าหน้าที่รักษาความปลอดภัยแล้ว กรุณาระบุลักษณะเพื่อรับคืน",
        "สนามเด็กเล่น",
        "resolved",
        "normal",
        -4,
      ],
      [
        "post-5",
        "neighbor-demo",
        3,
        "เสียงก่อสร้างนอกช่วงเวลาที่กำหนด",
        "มีเสียงเจาะผนังหลังเวลา 18.00 น. ขอให้นิติบุคคลช่วยประสานงาน",
        "ซอย 2",
        "resolved",
        "normal",
        -7,
      ],
      [
        "post-6",
        "resident-demo",
        2,
        "ขอให้ตัดแต่งกิ่งไม้ที่บังป้ายจราจร",
        "กิ่งไม้บังป้ายหยุดตรงทางแยก อาจทำให้ผู้ขับขี่มองไม่เห็น",
        "ทางแยกซอย 1",
        "in_progress",
        "normal",
        -5,
      ],
    ];
    for (const [
      pid,
      uid,
      cat,
      title,
      description,
      location,
      status,
      priority,
      days,
    ] of posts) {
      await tx.run(
        "INSERT INTO community_posts VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        [
          pid,
          uid,
          cat,
          title,
          description,
          location,
          status,
          priority,
          JSON.stringify({ demo: true }),
          date(days),
          date(days),
        ],
      );
      await tx.run("INSERT INTO post_history VALUES (?,?,?,?,?,?)", [
        id(),
        pid,
        uid,
        "pending",
        "ส่งเรื่องเข้าสู่ระบบ",
        date(days),
      ]);
      if (status !== "pending")
        await tx.run("INSERT INTO post_history VALUES (?,?,?,?,?,?)", [
          id(),
          pid,
          "juristic-demo",
          status,
          status === "resolved"
            ? "ดำเนินการเรียบร้อยแล้ว"
            : "รับเรื่องแล้ว กำลังประสานเจ้าหน้าที่",
          date(days, 2),
        ]);
    }
    await tx.run("INSERT INTO comments VALUES (?,?,?,?,?)", [
      id(),
      "post-1",
      "juristic-demo",
      "เจ้าหน้าที่เข้าตรวจสอบแล้ว อยู่ระหว่างเปลี่ยนหลอดไฟ คาดว่าเสร็จภายในวันพรุ่งนี้ค่ะ",
      date(-1),
    ]);
    for (const e of [
      [
        "eq-1",
        "เก้าอี้พับ",
        "สำหรับกิจกรรมและงานสังสรรค์ในชุมชน",
        30,
        28,
        "chair",
      ],
      ["eq-2", "โต๊ะอเนกประสงค์", "โต๊ะพับขนาด 180 ซม.", 10, 10, "table"],
      ["eq-3", "ชุดเครื่องเสียง", "ลำโพงพร้อมไมโครโฟนไร้สาย", 2, 2, "speaker"],
      ["eq-4", "เต็นท์สนาม", "เต็นท์ขนาด 3 × 3 เมตร", 4, 4, "tent"],
      [
        "eq-5",
        "อุปกรณ์ทำสวน",
        "ชุดกรรไกรตัดกิ่งและอุปกรณ์ดูแลสวน",
        5,
        5,
        "plant",
      ],
    ])
      await tx.run("INSERT INTO equipment VALUES (?,?,?,?,?,?,1)", e);
    await tx.run("INSERT INTO loans VALUES (?,?,?,?,?,?,?,?,?)", [
      "loan-demo",
      "eq-1",
      "resident-demo",
      2,
      date(3).slice(0, 10),
      "จัดงานวันเกิดในครอบครัว",
      "borrowed",
      null,
      date(-1),
    ]);
    for (const [aid, title, body, pinned, days] of [
      [
        "ann-1",
        "แจ้งล้างถังพักน้ำประจำเดือน",
        "ขอความร่วมมือสำรองน้ำใช้ในวันเสาร์ เวลา 09.00–12.00 น. เจ้าหน้าที่จะดำเนินการล้างถังพักน้ำส่วนกลาง ติดต่อสำนักงานหากต้องการความช่วยเหลือ",
        1,
        -1,
      ],
      [
        "ann-2",
        "ร่วมแยกขยะ ลดขยะในชุมชน",
        "นำขวดพลาสติกและกระดาษมาส่งที่จุดรับรีไซเคิลข้างคลับเฮาส์ ทุกวันอาทิตย์ เวลา 09.00–11.00 น.",
        0,
        -3,
      ],
      [
        "ann-3",
        "เปิดให้ยืมอุปกรณ์ส่วนกลางผ่านระบบแล้ว",
        "ลูกบ้านสามารถตรวจสอบจำนวนอุปกรณ์และทำรายการยืมผ่านเว็บไซต์ กรุณาคืนอุปกรณ์ตามกำหนดเพื่อแบ่งปันให้เพื่อนบ้าน",
        0,
        -5,
      ],
    ])
      await tx.run("INSERT INTO announcements VALUES (?,?,?,?,?,?)", [
        aid,
        "juristic-demo",
        title,
        body,
        pinned,
        date(days),
      ]);
    for (const [eid, title, desc, loc, days, cap] of [
      [
        "event-1",
        "เช้าวันอาทิตย์ ชวนกันปลูกต้นไม้",
        "เพิ่มพื้นที่สีเขียวให้หมู่บ้าน เตรียมหมวกและขวดน้ำส่วนตัวมาด้วย",
        "สวนส่วนกลาง",
        5,
        30,
      ],
      [
        "event-2",
        "ประชุมลูกบ้านประจำเดือน",
        "รับฟังผลการดำเนินงานและเสนอความคิดเห็นเรื่องส่วนกลาง",
        "ห้องประชุมคลับเฮาส์",
        10,
        60,
      ],
      [
        "event-3",
        "เดิน–วิ่งเพื่อสุขภาพ",
        "พบเพื่อนบ้านและออกกำลังกายเบา ๆ ทุกวัยเข้าร่วมได้",
        "ลานหน้าคลับเฮาส์",
        3,
        40,
      ],
    ])
      await tx.run("INSERT INTO events VALUES (?,?,?,?,?,?,?)", [
        eid,
        title,
        desc,
        loc,
        date(days),
        cap,
        "juristic-demo",
      ]);
    await tx.run("INSERT INTO event_attendees VALUES (?,?,?)", [
      "event-1",
      "neighbor-demo",
      now(),
    ]);
    await tx.run("INSERT INTO notifications VALUES (?,?,?,?,?,0,?)", [
      id(),
      "resident-demo",
      "นิติบุคคลรับเรื่องของคุณแล้ว",
      "กำลังตรวจสอบไฟส่องสว่างหน้าสวนส่วนกลาง",
      "posts/post-1",
      date(-1),
    ]);
  });
}
