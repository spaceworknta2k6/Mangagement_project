const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const MAP_PATH = '../../image_build_map.json';
const OUTPUT_DIR = '../../screenshots_handdrawn';

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Menus based on layout.js
const NAV_ITEMS = [
    { id: 'tongquan', label: 'Tổng quan', roles: ['ADMIN', 'STAFF', 'LECTURER', 'STUDENT'] },
    { id: 'hocphandoan', label: 'Học phần đồ án', roles: ['ADMIN', 'STAFF'] },
    { id: 'tieuchi', label: 'Tiêu chí đánh giá', roles: ['ADMIN', 'STAFF'] },
    { id: 'sinhvien', label: 'Danh sách sinh viên', roles: ['ADMIN', 'STAFF'] },
    { id: 'nhom', label: 'Nhóm', roles: ['ADMIN', 'STAFF', 'STUDENT'] },
    { id: 'detai', label: 'Đề tài', roles: ['ADMIN', 'STAFF', 'LECTURER', 'STUDENT'] },
    { id: 'doidetai', label: 'Đổi đề tài', roles: ['ADMIN', 'STAFF', 'LECTURER', 'STUDENT'] },
    { id: 'duan', label: 'Dự án', roles: ['ADMIN', 'STAFF', 'LECTURER', 'STUDENT'] },
    { id: 'nopbai', label: 'Nộp bài', roles: ['ADMIN', 'LECTURER', 'STUDENT'] },
    { id: 'giahan', label: 'Gia hạn', roles: ['ADMIN', 'STAFF', 'LECTURER', 'STUDENT'] },
    { id: 'diemso', label: 'Điểm số', roles: ['ADMIN', 'STAFF', 'LECTURER'] },
    { id: 'thongbao', label: 'Thông báo', roles: ['ADMIN', 'STAFF', 'LECTURER', 'STUDENT'] },
    { id: 'chat', label: 'Chat', roles: ['ADMIN', 'STAFF', 'LECTURER', 'STUDENT'] },
    { id: 'nhatky', label: 'Nhật ký', roles: ['ADMIN', 'STAFF'] },
    { id: 'taikhoan', label: 'Quản lý tài khoản', roles: ['ADMIN'] },
];

(async () => {
    const rawData = fs.readFileSync(MAP_PATH, 'utf-8');
    const imageMap = JSON.parse(rawData);
    const filteredMap = imageMap.filter(item => {
        const p = item.file;
        return p.includes('0') || p.includes('1') || p.includes('2') || p.includes('3') || p.includes('4') || p.includes('5') || p.includes('6') || p.includes('7');
    });

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

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
        let role = 'ADMIN';
        let roleLabel = 'Quản trị viên';
        let avatarColor = '#e74c3c';
        
        if (filename.includes('Staff_') || filename.includes('UC2.') || filename.includes('UC3.5') || filename.includes('UC3.8') || filename.includes('UC5.2') || filename.includes('UC5.4') || filename.includes('UC5.6') || filename.includes('UC5.7')) {
            role = 'STAFF'; roleLabel = 'Giáo vụ'; avatarColor = '#9b59b6';
        } else if (filename.includes('GV_') || filename.includes('UC4.1') || filename.includes('UC4.3') || filename.includes('UC4.4') || filename.includes('UC5.3')) {
            role = 'LECTURER'; roleLabel = 'Giảng viên'; avatarColor = '#3498db';
        } else if (filename.includes('SV_') || filename.includes('UC3.2') || filename.includes('UC3.3') || filename.includes('UC3.4') || filename.includes('UC3.6') || filename.includes('UC4.2') || filename.includes('UC4.5') || filename.includes('UC5.1') || filename.includes('UC5.5') || filename.includes('UC1.4')) {
            role = 'STUDENT'; roleLabel = 'Sinh viên'; avatarColor = '#2ecc71';
        }

        // 2. Active Menu
        let activeMenu = 'tongquan';
        if (filename.includes('TaiKhoan')) activeMenu = 'taikhoan';
        else if (filename.includes('HocPhanDoAn')) activeMenu = 'hocphandoan';
        else if (filename.includes('SV')) activeMenu = 'sinhvien';
        else if (filename.includes('DeTai')) activeMenu = 'detai';
        else if (filename.includes('Nhom')) activeMenu = 'nhom';
        else if (filename.includes('GiaHan')) activeMenu = 'giahan';
        else if (filename.includes('Diem') || filename.includes('PhieuCham')) activeMenu = 'diemso';
        else if (filename.includes('TongHop')) activeMenu = 'duan';
        else if (filename.includes('Chat')) activeMenu = 'chat';
        else if (filename.includes('NopBai')) activeMenu = 'nopbai';

        // Ensure active menu exists for role, else fallback
        const menusForRole = NAV_ITEMS.filter(m => m.roles.includes(role));
        if (!menusForRole.find(m => m.id === activeMenu)) {
            activeMenu = menusForRole[0].id;
        }

        // 3. Generate Sidebar HTML
        let sidebarHtml = '';
        menusForRole.forEach(m => {
            const isActive = m.id === activeMenu;
            sidebarHtml += `
                <div style="padding: 12px 20px; font-size: 16px; ${isActive ? 'background-color: #feeebf; font-weight: bold; border-left: 4px solid #f39c12;' : ''}">
                    ❖ ${m.label} ${isActive ? ' ◀' : ''}
                </div>
            `;
        });

        // 4. Generate Main Content HTML
        let contentHtml = '';
        
        if (type === 'login') {
            contentHtml = `
                <div style="display:flex; height: 100%; align-items:center; justify-content:center;">
                    <div style="width: 400px; padding: 30px; border: 3px solid #333; border-radius: 15px 225px 15px 255px/255px 15px 225px 15px; box-shadow: 8px 8px 0 rgba(0,0,0,0.2); background: #fff;">
                        <h2 style="text-align:center; font-weight:bold; margin-top:0;">ĐĂNG NHẬP</h2>
                        <div style="margin-top: 20px;">
                            <label>Email:</label>
                            <input type="text" value="${nameLower.includes('trong') ? '' : (nameLower.includes('thieu') ? 'admin@st.phenikaa' : 'admin@st.phenikaa-uni.edu.vn')}" style="width:100%; padding:8px; border:2px solid #555; border-radius:15px; margin-top:5px; margin-bottom:15px; font-family:'Comic Sans MS'">
                            
                            <label>Mật khẩu:</label>
                            <input type="password" value="${nameLower.includes('trong') || nameLower.includes('thieu') ? '' : (nameLower.includes('sai') ? 'sai_mat_khau' : '********')}" style="width:100%; padding:8px; border:2px solid #555; border-radius:15px; margin-top:5px; margin-bottom:20px; font-family:'Comic Sans MS'">
                            
                            <button style="width:100%; padding:10px; background:#3498db; color:white; font-weight:bold; border:2px solid #333; border-radius:15px;">Đăng nhập</button>
                        </div>
                    </div>
                </div>
            `;
        } else if (type === 'list' || type === 'dashboard') {
            let searchKeyword = '';
            let isSearch = false;
            let hasResults = true;
            
            if (nameLower.includes('timkiem')) {
                isSearch = true;
                if (nameLower.includes('khongcokq')) {
                    searchKeyword = 'Dữ liệu ma thuật';
                    hasResults = false;
                } else {
                    searchKeyword = 'Dữ liệu mẫu 1';
                    hasResults = true;
                }
            }

            let tableBody = '';
            if (!hasResults) {
                tableBody = `
                    <tr style="background:#fff;">
                        <td colspan="5" style="padding:30px; text-align:center; font-style:italic; color:#777;">Không tìm thấy dữ liệu nào phù hợp với "${searchKeyword}"</td>
                    </tr>
                `;
            } else if (isSearch && hasResults) {
                tableBody = `
                    <tr style="background:#fff; border-bottom:1px solid #ccc;">
                        <td style="padding:10px; border-right:1px solid #ccc; text-align:center;">01</td>
                        <td style="padding:10px; border-right:1px solid #ccc; background:#fff2a8;">Dữ liệu mẫu 1</td>
                        <td style="padding:10px; border-right:1px solid #ccc;">Nguyễn Văn A</td>
                        <td style="padding:10px; border-right:1px solid #ccc;">12/10/2026</td>
                        <td style="padding:10px; text-align:center;">Hoàn thành</td>
                    </tr>
                `;
            } else {
                tableBody = `
                    <tr style="background:#fff; border-bottom:1px solid #ccc;">
                        <td style="padding:10px; border-right:1px solid #ccc; text-align:center;">01</td>
                        <td style="padding:10px; border-right:1px solid #ccc;">Dữ liệu mẫu 1</td>
                        <td style="padding:10px; border-right:1px solid #ccc;">Nguyễn Văn A</td>
                        <td style="padding:10px; border-right:1px solid #ccc;">12/10/2026</td>
                        <td style="padding:10px; text-align:center;">Hoàn thành</td>
                    </tr>
                    <tr style="background:#f9f9f9; border-bottom:1px solid #ccc;">
                        <td style="padding:10px; border-right:1px solid #ccc; text-align:center;">02</td>
                        <td style="padding:10px; border-right:1px solid #ccc;">Dữ liệu mẫu 2</td>
                        <td style="padding:10px; border-right:1px solid #ccc;">Trần Thị B</td>
                        <td style="padding:10px; border-right:1px solid #ccc;">13/10/2026</td>
                        <td style="padding:10px; text-align:center;">Chờ duyệt</td>
                    </tr>
                    <tr style="background:#fff; border-bottom:1px solid #ccc;">
                        <td style="padding:10px; border-right:1px solid #ccc; text-align:center;">03</td>
                        <td style="padding:10px; border-right:1px solid #ccc;">Dữ liệu mẫu 3</td>
                        <td style="padding:10px; border-right:1px solid #ccc;">Lê Văn C</td>
                        <td style="padding:10px; border-right:1px solid #ccc;">14/10/2026</td>
                        <td style="padding:10px; text-align:center;">Hoạt động</td>
                    </tr>
                    <tr style="background:#f9f9f9; border-bottom:1px solid #ccc;">
                        <td style="padding:10px; border-right:1px solid #ccc; text-align:center;">04</td>
                        <td style="padding:10px; border-right:1px solid #ccc;">Dữ liệu mẫu 4</td>
                        <td style="padding:10px; border-right:1px solid #ccc;">Phạm Văn D</td>
                        <td style="padding:10px; border-right:1px solid #ccc;">15/10/2026</td>
                        <td style="padding:10px; text-align:center;">Hủy bỏ</td>
                    </tr>
                    <tr style="background:#fff;">
                        <td style="padding:10px; border-right:1px solid #ccc; text-align:center;">05</td>
                        <td style="padding:10px; border-right:1px solid #ccc;">Dữ liệu mẫu 5</td>
                        <td style="padding:10px; border-right:1px solid #ccc;">Hoàng Thị E</td>
                        <td style="padding:10px; border-right:1px solid #ccc;">16/10/2026</td>
                        <td style="padding:10px; text-align:center;">Hoàn thành</td>
                    </tr>
                `;
            }

            contentHtml = `
                <!-- Toolbar Area -->
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #ccc;">
                    <div style="display:flex; gap: 15px;">
                        <div style="text-align:center; cursor:pointer;"><div style="width:40px; height:40px; border-radius:50%; background:#2ecc71; color:white; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:bold; margin:0 auto; border:2px solid #333;">+</div><span style="font-size:12px;">Thêm</span></div>
                        <div style="text-align:center; cursor:pointer;"><div style="width:40px; height:40px; border-radius:50%; background:#e67e22; color:white; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:bold; margin:0 auto; border:2px solid #333;">✎</div><span style="font-size:12px;">Sửa</span></div>
                        <div style="text-align:center; cursor:pointer;"><div style="width:40px; height:40px; border-radius:50%; background:#f1c40f; color:white; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:bold; margin:0 auto; border:2px solid #333;">🗑</div><span style="font-size:12px;">Xóa</span></div>
                        <div style="text-align:center; cursor:pointer;"><div style="width:40px; height:40px; border-radius:50%; background:#3498db; color:white; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:bold; margin:0 auto; border:2px solid #333;">i</div><span style="font-size:12px;">Chi tiết</span></div>
                    </div>
                    <div style="display:flex; gap: 10px; align-items:center;">
                        <input type="text" value="${searchKeyword}" placeholder="Tìm kiếm gì đi..." style="padding:8px 15px; border:2px solid #333; border-radius:15px; font-family:'Comic Sans MS'; width: 200px; ${isSearch ? 'background:#fff2a8;' : ''}">
                        <button style="padding:8px 15px; background:${isSearch ? '#27ae60' : '#2ecc71'}; color:white; font-weight:bold; border:2px solid #333; border-radius:15px;">${isSearch ? 'Đang tìm...' : '🔍'}</button>
                        <button style="padding:8px 15px; background:#fff; font-weight:bold; border:2px solid #333; border-radius:15px;">↻ Làm mới</button>
                    </div>
                </div>
                <!-- Table Area -->
                <table style="width:100%; border-collapse:collapse; border:2px solid #333;">
                    <thead>
                        <tr style="background:#ecf0f1; border-bottom:2px solid #333;">
                            <th style="padding:10px; border-right:1px solid #ccc;">ID</th>
                            <th style="padding:10px; border-right:1px solid #ccc;">Tên</th>
                            <th style="padding:10px; border-right:1px solid #ccc;">Thông tin 1</th>
                            <th style="padding:10px; border-right:1px solid #ccc;">Thông tin 2</th>
                            <th style="padding:10px;">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableBody}
                    </tbody>
                </table>
            `;
        } else if (type === 'form') {
            contentHtml = `
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #ccc; padding-bottom:15px; margin-bottom:20px;">
                    <h2 style="margin:0; font-family:'Comic Sans MS'">${cleanTitle}</h2>
                    <button style="padding:8px 15px; background:#3498db; color:white; font-weight:bold; border:2px solid #333; border-radius:15px;">💾 Lưu lại</button>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:20px;">
                    <div style="width:48%;">
                        <label style="font-weight:bold;">Trường dữ liệu 1:</label><br>
                        <input type="text" value="Dữ liệu mẫu minh họa" style="width:100%; padding:8px; border:2px solid #555; border-radius:10px; margin-top:5px; font-family:'Comic Sans MS'">
                    </div>
                    <div style="width:48%;">
                        <label style="font-weight:bold;">Trường dữ liệu 2:</label><br>
                        <select style="width:100%; padding:8px; border:2px solid #555; border-radius:10px; margin-top:5px; font-family:'Comic Sans MS'">
                            <option>Lựa chọn 1</option>
                            <option>Lựa chọn 2</option>
                        </select>
                    </div>
                    <div style="width:100%;">
                        <label style="font-weight:bold;">Mô tả chi tiết:</label><br>
                        <textarea style="width:100%; height:120px; padding:8px; border:2px solid #555; border-radius:10px; margin-top:5px; font-family:'Comic Sans MS'">Đây là nội dung mô tả mẫu được tự động điền để minh họa cho biểu mẫu này. Nó giúp người dùng hình dung được cách thức hiển thị dữ liệu dài trong giao diện thực tế.</textarea>
                    </div>
                </div>
            `;
        } else if (type === 'chat') {
            contentHtml = `
                <div style="display:flex; height:100%; border:2px solid #333; border-radius:10px; overflow:hidden;">
                    <!-- Chat Sidebar -->
                    <div style="width:250px; border-right:2px solid #333; background:#f9f9f9;">
                        <div style="padding:15px; border-bottom:1px solid #ccc; font-weight:bold;">Đoạn chat gần đây</div>
                        <div style="padding:15px; background:#e0f7fa; border-bottom:1px solid #ccc; display:flex; align-items:center; gap:10px;">
                            <div style="width:30px; height:30px; border-radius:50%; background:#2ecc71;"></div>
                            <div>
                                <div style="font-weight:bold; font-size:14px;">Thầy Hải</div>
                                <div style="font-size:12px; color:#555;">Các em nhớ nộp báo cáo nhé...</div>
                            </div>
                        </div>
                        <div style="padding:15px; border-bottom:1px solid #ccc; display:flex; align-items:center; gap:10px;">
                            <div style="width:30px; height:30px; border-radius:50%; background:#9b59b6;"></div>
                            <div>
                                <div style="font-weight:bold; font-size:14px;">Nhóm 1 - AI</div>
                                <div style="font-size:12px; color:#555;">Dạ vâng ạ.</div>
                            </div>
                        </div>
                    </div>
                    <!-- Chat Area -->
                    <div style="flex:1; display:flex; flex-direction:column; background:#fff;">
                        <div style="padding:15px; border-bottom:1px solid #ccc; font-weight:bold; font-size:18px;">Chat: Thầy Hải</div>
                        <div style="flex:1; padding:20px; display:flex; flex-direction:column; gap:15px;">
                            <div style="align-self:flex-start; max-width:70%; background:#ecf0f1; padding:10px 15px; border-radius:15px; border:1px solid #ccc;">
                                Thầy ơi nhóm em nộp báo cáo tuần này muộn 1 hôm được không ạ?
                            </div>
                            <div style="align-self:flex-end; max-width:70%; background:#3498db; color:white; padding:10px 15px; border-radius:15px; border:1px solid #2980b9;">
                                Không được đâu em, deadline là deadline. Cố gắng nộp đúng hạn nhé.
                            </div>
                            <div style="align-self:flex-start; max-width:70%; background:#ecf0f1; padding:10px 15px; border-radius:15px; border:1px solid #ccc;">
                                Dạ vâng ạ, bọn em sẽ cố gắng ạ.
                            </div>
                        </div>
                        <div style="padding:15px; border-top:1px solid #ccc; display:flex; gap:10px;">
                            <input type="text" placeholder="Nhập tin nhắn..." style="flex:1; padding:10px; border:2px solid #ccc; border-radius:20px; font-family:'Comic Sans MS'">
                            <button style="padding:10px 20px; background:#3498db; color:white; font-weight:bold; border:2px solid #2980b9; border-radius:20px;">Gửi</button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Ensure error types overlay a list view
        if (type.startsWith('dialog_')) {
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

            const icon = type === 'dialog_error' ? '❌' : (type === 'dialog_confirm' ? '⚠️' : '✅');
            const header = type === 'dialog_error' ? 'Lỗi hệ thống' : (type === 'dialog_confirm' ? 'Xác nhận' : 'Thành công');
            
            let btns = `<button style="padding:10px 25px;border:2px solid #333;background:#333;color:white;font-weight:bold;margin-top:20px;border-radius:255px 15px 225px 15px/15px 225px 15px 255px;font-family:'Comic Sans MS'">Đóng</button>`;
            if (type === 'dialog_confirm') {
                btns = `<button style="padding:10px 25px;border:2px solid #333;background:#fff;margin-right:15px;color:#333;font-weight:bold;border-radius:255px 15px 225px 15px/15px 225px 15px 255px;font-family:'Comic Sans MS'">Hủy bỏ</button>` + btns;
            }

            // We generate a list view beneath it for realism
            contentHtml = `
                <!-- Background List -->
                <div style="filter: blur(2px);">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #ccc;">
                    <div style="display:flex; gap: 15px;">
                        <div style="text-align:center;"><div style="width:40px; height:40px; border-radius:50%; background:#2ecc71; color:white; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:bold; margin:0 auto; border:2px solid #333;">+</div><span style="font-size:12px;">Thêm</span></div>
                        <div style="text-align:center;"><div style="width:40px; height:40px; border-radius:50%; background:#e67e22; color:white; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:bold; margin:0 auto; border:2px solid #333;">✎</div><span style="font-size:12px;">Sửa</span></div>
                        <div style="text-align:center;"><div style="width:40px; height:40px; border-radius:50%; background:#f1c40f; color:white; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:bold; margin:0 auto; border:2px solid #333;">🗑</div><span style="font-size:12px;">Xóa</span></div>
                    </div>
                    <div style="display:flex; gap: 10px; align-items:center;">
                        <input type="text" placeholder="Tìm kiếm gì đi..." style="padding:8px 15px; border:2px solid #333; border-radius:15px; font-family:'Comic Sans MS'; width: 200px;">
                        <button style="padding:8px 15px; background:#2ecc71; color:white; font-weight:bold; border:2px solid #333; border-radius:15px;">🔍</button>
                    </div>
                </div>
                <table style="width:100%; border-collapse:collapse; border:2px solid #333;">
                    <tr style="background:#ecf0f1; border-bottom:2px solid #333;">
                        <th style="padding:10px; border-right:1px solid #ccc;">ID</th>
                        <th style="padding:10px; border-right:1px solid #ccc;">Tên</th>
                        <th style="padding:10px;">Trạng thái</th>
                    </tr>
                    <tr style="background:#fff; border-bottom:1px solid #ccc;">
                        <td style="padding:10px; border-right:1px solid #ccc; text-align:center;">01</td>
                        <td style="padding:10px; border-right:1px solid #ccc;">Dữ liệu 1</td>
                        <td style="padding:10px; text-align:center;">Hoàn thành</td>
                    </tr>
                </table>
                </div>

                <!-- OVERLAY -->
                <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; z-index:9999;">
                    <div style="background:#fff; padding:30px; border:4px solid #333; width:450px; text-align:center; border-radius:255px 15px 225px 15px/15px 225px 15px 255px; box-shadow:10px 10px 0 rgba(0,0,0,0.8);">
                        <h3 style="margin-top:0;font-size:24px;font-weight:bold;">${icon} ${header}</h3>
                        <p style="font-size:18px; margin:20px 0;">${realMessage}</p>
                        <div style="display:flex;justify-content:center;margin-top:15px;">${btns}</div>
                    </div>
                </div>
            `;
        }

        const fullHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {
                        margin: 0; padding: 20px;
                        background: #f0f0f0;
                        font-family: 'Comic Sans MS', cursive, sans-serif;
                        color: #222;
                    }
                    /* Balsamiq Browser Frame */
                    .browser {
                        width: 1024px; height: 768px;
                        margin: 0 auto;
                        background: #fff;
                        border: 3px solid #333;
                        border-radius: 10px 10px 0 0;
                        display: flex; flex-direction: column;
                        box-shadow: 5px 5px 15px rgba(0,0,0,0.2);
                        overflow: hidden;
                    }
                    .browser-header {
                        height: 40px; border-bottom: 3px solid #333;
                        display: flex; align-items: center; padding: 0 15px;
                        background: #fdfdfd; gap: 10px;
                    }
                    .browser-actions {
                        display:flex; gap: 5px; font-weight: bold; font-size: 18px;
                    }
                    .browser-url {
                        flex: 1; border: 2px solid #555; height: 24px; border-radius: 12px;
                        padding: 0 10px; font-size: 12px; display:flex; align-items:center;
                    }
                    /* Layout */
                    .layout {
                        display: flex; flex: 1;
                    }
                    /* Sidebar */
                    .sidebar {
                        width: 250px; border-right: 3px solid #333;
                        display: flex; flex-direction: column;
                    }
                    .sidebar-profile {
                        padding: 20px; border-bottom: 3px solid #333;
                        display: flex; align-items: center; gap: 15px;
                    }
                    .sidebar-avatar {
                        width: 50px; height: 50px; border-radius: 50%;
                        background: ${avatarColor}; color: white;
                        display: flex; align-items: center; justify-content: center;
                        font-size: 24px; font-weight: bold; border: 2px solid #333;
                    }
                    .sidebar-user h3 { margin: 0; font-size: 16px; }
                    .sidebar-user p { margin: 0; font-size: 12px; color: #555; }
                    
                    .sidebar-nav {
                        flex: 1; padding-top: 10px;
                    }
                    
                    .sidebar-bottom {
                        padding: 15px 20px; border-top: 3px solid #333;
                        font-weight: bold; font-size: 16px; display: flex; align-items: center; gap: 10px;
                    }

                    /* Main Content */
                    .main-wrapper {
                        flex: 1; display: flex; flex-direction: column; background: #fff;
                    }
                    .main-header {
                        padding: 15px 20px; border-bottom: 3px solid #333;
                        font-weight: bold; font-size: 18px; background: #fdfdfd;
                    }
                    .main-content {
                        flex: 1; padding: 20px; overflow: hidden;
                        margin: 15px;
                        border: 4px solid #8ab4f8; /* The requested blue border! */
                        border-radius: 5px;
                        position: relative;
                    }
                </style>
            </head>
            <body>
                <div class="browser">
                    <!-- Top Bar -->
                    <div style="text-align:center; font-size:12px; padding: 2px 0; border-bottom:1px solid #333;">A Web Page</div>
                    <div class="browser-header">
                        <div class="browser-actions">⬅ ➡ ✖ 🏠</div>
                        <div class="browser-url">http://localhost:3000/dashboard/${activeMenu}</div>
                    </div>
                    
                    <!-- App Layout -->
                    <div class="layout">
                        <!-- Sidebar -->
                        ${type === 'login' ? '' : `
                        <div class="sidebar">
                            <div class="sidebar-profile">
                                <div class="sidebar-avatar">${role.charAt(0)}</div>
                                <div class="sidebar-user">
                                    <h3>User Name</h3>
                                    <p>${roleLabel}</p>
                                </div>
                            </div>
                            <div class="sidebar-nav">
                                ${sidebarHtml}
                            </div>
                            <div class="sidebar-bottom">
                                🚪 Đăng xuất
                            </div>
                        </div>
                        `}
                        
                        <!-- Main Area -->
                        <div class="main-wrapper">
                            ${type === 'login' ? '' : `
                            <div class="main-header">
                                Quản lý Đồ án - ${cleanTitle}
                            </div>
                            `}
                            <div class="main-content" ${type === 'login' ? 'style="border-color:transparent"' : ''}>
                                ${contentHtml}
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        await page.setContent(fullHtml);
        // Wait briefly for rendering
        await page.waitForTimeout(100);
        
        const outPath = path.join(OUTPUT_DIR, filename);
        // Crop just the browser frame for an authentic look
        const browserElement = await page.$('.browser');
        if (browserElement) {
            await browserElement.screenshot({ path: outPath });
        } else {
            await page.screenshot({ path: outPath });
        }

        count++;
        console.log(`Captured [${count}/${filteredMap.length}]: ${filename}`);
    }

    await browser.close();
    console.log("Done generating Hand-Drawn Mockups!");
})();
