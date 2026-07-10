const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const MAP_PATH = '../../image_build_map.json';
const OUTPUT_DIR = '../../screenshots_balsamiq_real';

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

(async () => {
    const rawData = fs.readFileSync(MAP_PATH, 'utf-8');
    const imageMap = JSON.parse(rawData);
    
    // Filter out bad images
    const badFiles = ['012_UC1.2_DangXuat_Huy.png', '010_Admin_QLTaiKhoan_XacNhanXoa.png'];
    const filteredMap = imageMap.filter(img => !badFiles.some(bf => img.file.includes(bf)));

    console.log("Launching Playwright...");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    let currentRole = 'none';
    let count = 0;

    for (const item of filteredMap) {
        const filename = path.basename(item.file);
        
        let type = 'list';
        const nameLower = filename.toLowerCase();
        
        if (nameLower.includes('login') || nameLower.includes('dangnhap')) type = 'login';
        else if (nameLower.includes('chat')) type = 'chat';
        else if (nameLower.includes('tongquan')) type = 'dashboard';
        else if (nameLower.includes('loi') || nameLower.includes('sai') || nameLower.includes('trunglap') || nameLower.includes('chuaco') || nameLower.includes('quahan')) type = 'dialog_error';
        else if (nameLower.includes('xacnhan') || nameLower.includes('dangxuat') || nameLower.includes('tuchoi') || nameLower.includes('duyet')) type = 'dialog_confirm';
        else if (nameLower.includes('form') || nameLower.includes('chitiet') || nameLower.includes('dexuat')) type = 'form';
        
        let cleanTitle = item.caption;
        cleanTitle = cleanTitle.replace(/^Hình 1\.\d+\.\s*/, '');
        cleanTitle = cleanTitle.replace(/^Giao diện (thông báo lỗi )?/, '');
        cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
        if (cleanTitle.toLowerCase() === 'đăng nhập') cleanTitle = 'Hệ thống Quản lý Đồ án';

        // 1. Determine Target Role
        let targetRole = null;
        if (filename.includes('Admin_')) targetRole = 'admin';
        else if (filename.includes('Staff_')) targetRole = 'staff';
        else if (filename.includes('GV_')) targetRole = 'gv';
        else if (filename.includes('SV_')) targetRole = 'sv';
        else if (filename.includes('UC2.1') || filename.includes('UC3.5') || filename.includes('UC3.8') || filename.includes('UC5.2') || filename.includes('UC5.4') || filename.includes('UC5.6') || filename.includes('UC5.7')) targetRole = 'staff';
        else if (filename.includes('UC4.1') || filename.includes('UC4.3') || filename.includes('UC4.4') || filename.includes('UC5.3')) targetRole = 'gv';
        else if (filename.includes('UC2.4') || filename.includes('UC3.2') || filename.includes('UC3.3') || filename.includes('UC3.4') || filename.includes('UC3.6') || filename.includes('UC4.2') || filename.includes('UC4.5') || filename.includes('UC5.1') || filename.includes('UC5.5') || filename.includes('UC1.4')) targetRole = 'sv';

        if (type === 'login' || filename.includes('DangXuat')) targetRole = null;

        // 2. Switch Role if needed
        if (currentRole !== targetRole) {
            console.log(`Switching role from ${currentRole} to ${targetRole}`);
            await context.clearCookies();
            currentRole = targetRole;
            
            if (targetRole) {
                await page.goto('http://localhost:3000/auth/login');
                await page.waitForLoadState('networkidle');
                let email = '';
                if (targetRole === 'admin') email = 'admin@st.phenikaa-uni.edu.vn';
                if (targetRole === 'staff') email = 'huonglt@st.phenikaa-uni.edu.vn';
                if (targetRole === 'gv') email = 'haikt@st.phenikaa-uni.edu.vn';
                if (targetRole === 'sv') email = 'hoanganh@st.phenikaa-uni.edu.vn';
                
                try {
                    await page.fill('input[name="email"]', email);
                    await page.fill('input[name="password"]', 'password123');
                    await page.click('button[type="submit"]');
                    await page.waitForURL('**/dashboard**', { timeout: 10000 });
                } catch (e) {
                    console.log("Login form not found or already logged in.");
                }
            }
        }

        // 3. Determine URL
        let url = 'http://localhost:3000/dashboard';
        if (type === 'login' || filename.includes('DangXuat')) url = 'http://localhost:3000/auth/login';
        else if (filename.includes('TaiKhoan')) url += '/users';
        else if (filename.includes('HocPhanDoAn')) url += '/periods';
        else if (filename.includes('SV')) url += '/rosters';
        else if (filename.includes('DeTai')) url += '/topics';
        else if (filename.includes('Nhom')) url += '/groups';
        else if (filename.includes('GiaHan')) url += '/extensions';
        else if (filename.includes('Diem') || filename.includes('PhieuCham')) url += '/scores';
        else if (filename.includes('TongHop')) url += '/projects';
        else if (filename.includes('Chat')) url += '/chat';

        await page.goto(url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000); // Wait for animations/data to render
        
        // Custom Interaction for Chat or Forms
        if (type === 'chat') {
            await page.evaluate(() => {
                const items = document.querySelectorAll('li, [class*="cursor-pointer"], [role="button"]');
                for(let i=0; i<items.length; i++) {
                    if(items[i].innerText && items[i].innerText.length > 3) {
                        items[i].click(); break;
                    }
                }
            });
            await page.waitForTimeout(1000);
        }
        
        if (type === 'form' || type === 'login' || type === 'dialog_error') {
            await page.evaluate(() => {
                const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="checkbox"])');
                inputs.forEach(input => {
                    if (!input.value) {
                        if (input.type === 'email') input.value = 'admin@st.phenikaa-uni.edu.vn';
                        else if (input.type === 'password') input.value = 'wrongpassword123';
                        else if (input.type === 'number') input.value = '5';
                        else input.value = 'Dữ liệu mẫu minh họa';
                    }
                });
                const textareas = document.querySelectorAll('textarea');
                textareas.forEach(ta => {
                    if (!ta.value) ta.value = 'Đây là nội dung mô tả mẫu được tự động điền để minh họa cho giao diện hệ thống Quản lý Đồ án.';
                });
            });
        }
        
        // CSS Injection for True Balsamiq Wireframe Style on Real App
        await page.addStyleTag({
            content: `
                /* Override ALL fonts, colors, backgrounds to force a sketch look */
                * { 
                    font-family: 'Comic Sans MS', cursive, sans-serif !important; 
                    background-color: transparent !important;
                    color: #222 !important;
                    border-color: #444 !important;
                }
                
                /* Apply background white to main containers so it doesn't look messy */
                body, main, nav, aside, section, article, div[class*="bg-"], header, footer {
                    background-color: #fdfdfd !important;
                }
                
                /* Draw sketchy borders for elements */
                div, button, input, select, table, th, td, span, a, p, h1, h2, h3, h4, h5, h6 {
                    border-radius: 255px 15px 225px 15px/15px 225px 15px 255px !important;
                }
                
                /* Keep simple borders for structural elements */
                button, input, select, table, th, td, [class*="border"] {
                    border: 2px solid #555 !important;
                    box-shadow: 2px 2px 0px rgba(0,0,0,0.1) !important;
                    background-color: #fff !important;
                }
                
                /* Fix headers to be legible */
                h1, h2, h3 {
                    font-weight: bold !important;
                }
                
                /* Grayscale images/avatars */
                img, svg {
                    filter: grayscale(100%) contrast(150%) !important;
                }
                
                /* Hide toasts or existing overlays so they don't interfere */
                [role="status"] { display: none !important; }
                
                /* Fix injected popup */
                #injected-balsamiq-popup, #injected-balsamiq-popup * {
                    background-color: #fff !important;
                    color: #000 !important;
                }
            `
        });
        
        const outPath = path.join(OUTPUT_DIR, filename);

        if (type.startsWith('dialog_')) {
            // Determine realistic message based on filename
            let realMessage = cleanTitle;
            const nm = filename.toLowerCase();
            if (nm.includes('thieuthongtin')) realMessage = 'Vui lòng điền đầy đủ email và mật khẩu!';
            else if (nm.includes('saimatkha') || nm.includes('login')) realMessage = 'Tài khoản hoặc mật khẩu không chính xác!';
            else if (nm.includes('loivalidation')) realMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại!';
            else if (nm.includes('loitrunglap')) realMessage = 'Mã thực thể đã tồn tại trong hệ thống!';
            else if (nm.includes('loitrunggv')) realMessage = 'Giảng viên đã được phân công quá số nhóm tối đa!';
            else if (nm.includes('loichenhlech')) realMessage = 'Điểm chênh lệch giữa 2 GV vượt quá 2.0. Cần hội đồng xem xét!';
            else if (nm.includes('loichuaduphieu')) realMessage = 'Chưa đủ phiếu chấm để tổng hợp điểm!';
            else if (nm.includes('loivuotqua')) realMessage = 'Nhóm đã đạt số lượng thành viên tối đa!';
            else if (nm.includes('loivuotmuc')) realMessage = 'Điểm nhập vào không được vượt quá điểm tối đa của tiêu chí!';
            else if (nm.includes('loichuakhoa')) realMessage = 'Bạn phải khóa phiếu điểm trước khi hoàn tất!';
            else if (nm.includes('loiketnoi')) realMessage = 'Không thể kết nối đến AI Server. Vui lòng thử lại sau!';
            else if (nm.includes('chuaco')) realMessage = 'Chưa có dữ liệu phân công cho học kỳ này!';
            else if (nm.includes('quahan')) realMessage = 'Đã quá hạn để thực hiện thao tác này!';
            else if (nm.includes('xacnhanxoa') || nm.includes('dangxuat') || nm.includes('xacnhan') || nm.includes('duyet')) realMessage = 'Bạn có chắc chắn muốn thực hiện hành động này không?';

            // Hijack DOM to show popup
            await page.evaluate(({realMessage, type}) => {
                const existing = document.getElementById('injected-balsamiq-popup');
                if (existing) existing.remove();

                const overlay = document.createElement('div');
                overlay.id = 'injected-balsamiq-popup-overlay';
                overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:999999;';
                
                const popup = document.createElement('div');
                popup.id = 'injected-balsamiq-popup';
                popup.style.cssText = 'background:#fff;padding:30px;border:4px solid #333;width:450px;text-align:center;border-radius:255px 15px 225px 15px/15px 225px 15px 255px;box-shadow: 10px 10px 0 rgba(0,0,0,0.8); position: relative;';
                
                const icon = type === 'dialog_error' ? '❌' : (type === 'dialog_confirm' ? '⚠️' : '✅');
                const header = type === 'dialog_error' ? 'Lỗi hệ thống' : (type === 'dialog_confirm' ? 'Xác nhận' : 'Thành công');
                
                let btns = '<button style="padding:10px 25px;border:2px solid #333;background:#333;color:white;font-weight:bold;margin-top:20px;border-radius:255px 15px 225px 15px/15px 225px 15px 255px;">Đóng</button>';
                if (type === 'dialog_confirm') {
                    btns = '<button style="padding:10px 25px;border:2px solid #333;background:#fff;margin-right:15px;color:#333;font-weight:bold;border-radius:255px 15px 225px 15px/15px 225px 15px 255px;">Hủy bỏ</button>' + btns;
                }

                popup.innerHTML = `
                    <h3 style="margin-top:0;font-size:24px;font-weight:bold;font-family:'Comic Sans MS', cursive;">${icon} ${header}</h3>
                    <p style="font-size:18px;font-family:'Comic Sans MS', cursive;margin:20px 0;">${realMessage}</p>
                    <div style="display:flex;justify-content:center;margin-top:15px;">${btns}</div>
                `;
                
                overlay.appendChild(popup);
                document.body.appendChild(overlay);
            }, {realMessage, type});

            await page.waitForTimeout(500);
            const popupElement = await page.$('#injected-balsamiq-popup');
            if (popupElement) {
                await popupElement.screenshot({ path: outPath });
            } else {
                await page.screenshot({ path: outPath });
            }
        } else {
            // Hijack Header text
            await page.evaluate((cleanTitle) => {
                const h1s = document.querySelectorAll('h1, h2, h3');
                for (let i = 0; i < h1s.length; i++) {
                    if (h1s[i].textContent && h1s[i].textContent.length > 3) {
                        h1s[i].innerText = cleanTitle;
                        break;
                    }
                }
            }, cleanTitle);
            await page.screenshot({ path: outPath });
        }
        
        count++;
        console.log(`Captured [${count}/${filteredMap.length}]: ${filename} (Role: ${currentRole})`);
    }

    await browser.close();
    console.log("Done generating Real UI Balsamiq mockups!");
})();
