# CONT Workflow Reference

## Statuses

| Database | UI |
| --- | --- |
| `brief` | รอรับบรีฟ |
| `drafting` | กำลังดราฟต์ |
| `review` | รอคอมเมนต์ |
| `revision` | แก้ไขงาน |
| `completed` | ส่งมอบไฟล์สำเร็จ |

## Allowed transitions

- `brief → drafting`
- `drafting → review`
- `review → revision`
- `review → completed` (กรณีไม่มี Revision)
- `revision → review`
- `revision → completed`
- `completed → revision` (Reopen)

ทุก status change ต้องสร้าง `task_history` และงาน `completed` จะไม่ถูกลบออกจาก database; จะถูกซ่อนจาก Active Kanban และรวมอยู่ใน Work History แทน

## Workload

`Current Workload = SUM(workload_points ของ active tasks)`

`Workload % = Current Workload / capacity_points × 100`

- Low < 50%
- Normal 50–79%
- High 80–99%
- Overloaded ≥ 100%

Workload เป็นเครื่องมือช่วยจัดสรรงาน ไม่ใช่คะแนนความเก่งของสมาชิก
