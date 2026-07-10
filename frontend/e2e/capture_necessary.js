const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = '../../../screenshots_real_ui';
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const flows = [
    { file: '01_Login.png', caption: 'Giao diện Đăng nhập hệ thống', role: null, url: '/auth/login' },
    
    // ADMIN / STAFF
    { file: '02_Admin_Dashboard.png', caption: 'Màn hình Tổng quan (Quản trị viên / Giáo vụ)', role: 'admin', url: '/dashboard' },
    { file: '03_Admin_Users.png', caption: 'Quản lý Tài khoản', role: 'admin', url: '/dashboard/users' },
    { file: '04_Admin_Periods.png', caption: 'Quản lý Học phần đồ án', role: 'admin', url: '/dashboard/periods' },
    { file: '05_Admin_Rubrics.png', caption: 'Quản lý Tiêu chí đánh giá (Rubrics)', role: 'admin', url: '/dashboard/rubrics' },
    { file: '06_Admin_Rosters.png', caption: 'Quản lý Danh sách sinh viên (Rosters)', role: 'admin', url: '/dashboard/rosters' },
    { file: '07_Admin_Topics.png', caption: 'Duyệt và Quản lý Đề tài', role: 'admin', url: '/dashboard/topics' },
    { file: '08_Admin_Audit.png', caption: 'Nhật ký hệ thống (Audit Log)', role: 'admin', url: '/dashboard/audit' },

    // LECTURER
    { file: '09_Lecturer_Dashboard.png', caption: 'Màn hình Tổng quan (Giảng viên)', role: 'gv', url: '/dashboard' },
    { file: '10_Lecturer_Topics.png', caption: 'Danh sách Đề tài hướng dẫn', role: 'gv', url: '/dashboard/topics' },
    { file: '11_Lecturer_Scores.png', caption: 'Giao diện Nhập điểm / Chấm điểm', role: 'gv', url: '/dashboard/scores' },
    { file: '12_Lecturer_Submissions.png', caption: 'Xem báo cáo nộp bài của sinh viên', role: 'gv', url: '/dashboard/submissions' },

    // STUDENT
    { file: '13_Student_Dashboard.png', caption: 'Màn hình Tổng quan (Sinh viên)', role: 'sv', url: '/dashboard' },
    { file: '14_Student_Group.png', caption: 'Quản lý Nhóm sinh viên', role: 'sv', url: '/dashboard/groups' },
    { file: '15_Student_Topics.png', caption: 'Đăng ký và Đề xuất Đề tài', role: 'sv', url: '/dashboard/topics' },
    { file: '16_Student_TopicChanges.png', caption: 'Yêu cầu Đổi đề tài', role: 'sv', url: '/dashboard/topic-changes' },
    { file: '17_Student_Project.png', caption: 'Không gian Dự án (Tiến độ)', role: 'sv', url: '/dashboard/projects' },
    { file: '18_Student_Submissions.png', caption: 'Nộp báo cáo định kỳ', role: 'sv', url: '/dashboard/submissions' },
    { file: '19_Student_Extensions.png', caption: 'Xin gia hạn nộp bài', role: 'sv', url: '/dashboard/extensions' },
    { file: '20_Student_Notifications.png', caption: 'Xem Thông báo', role: 'sv', url: '/dashboard/notifications' },
    { file: '21_Student_Chat.png', caption: 'Giao diện Nhắn tin / Trao đổi nhóm', role: 'sv', url: '/dashboard/chat' },
];

(async () => {
    console.log("Launching Playwright...");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    let currentRole = 'none';

    for (const item of flows) {
        if (currentRole !== item.role) {
            console.log(`Switching role to ${item.role}`);
            await context.clearCookies();
            currentRole = item.role;
            
            if (item.role) {
                await page.goto('http://localhost:3000/auth/login');
                await page.waitForLoadState('networkidle');
                
                let email = '';
                if (item.role === 'admin') email = 'admin@demo.com';
                if (item.role === 'staff') email = 'admin@demo.com'; 
                if (item.role === 'gv') email = 'giangvien@demo.com';
                if (item.role === 'sv') email = 'sinhvien1@demo.com';
                
                try {
                    await page.fill('input[name="email"]', email);
                    await page.fill('input[name="password"]', '123456');
                    await page.click('button[type="submit"]');
                    await page.waitForURL('**/dashboard**', { timeout: 10000 });
                } catch (e) {
                    console.log("Login form not found or already logged in.");
                }
            }
        }

        const fullUrl = `http://localhost:3000${item.url}`;
        await page.goto(fullUrl);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); 

        // Nếu là trang chat, bấm vào group đầu tiên để hiện khung chat
        if (item.url.includes('chat')) {
            await page.evaluate(() => {
                const items = document.querySelectorAll('li, [class*="cursor-pointer"]');
                for(let i=0; i<items.length; i++) {
                    if(items[i].innerText && items[i].innerText.length > 3) {
                        items[i].click(); break;
                    }
                }
            });
            await page.waitForTimeout(1000);
        }

        const outPath = path.join(OUTPUT_DIR, item.file);
        await page.screenshot({ path: outPath });
        console.log(`Captured: ${item.file}`);
    }

    // Save mapping for docx generator
    fs.writeFileSync(path.join(OUTPUT_DIR, 'map.json'), JSON.stringify(flows, null, 2));

    await browser.close();
    console.log("Done generating necessary UI screenshots!");
})();
