const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = '../../screenshots_handdrawn';

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

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
    { id: 'taikhoan', label: 'Quản lý tài khoản', roles: ['ADMIN'] },
];

const TARGET_IMAGES = [
    // Auth (1.10 - 1.14)
    { file: '001_Login_Trong.png', caption: 'Đăng nhập', role: 'ADMIN', menu: 'login', type: 'login' },
    { file: '002_Login_LoiHopLe.png', caption: 'Lỗi nhập thông tin không hợp lệ', role: 'ADMIN', menu: 'login', type: 'dialog_error' },
    { file: '003_Login_Thieu.png', caption: 'Lỗi thiếu thông tin đăng nhập', role: 'ADMIN', menu: 'login', type: 'dialog_error' },
    { file: '004_Logout_Nut.png', caption: 'Nút đăng xuất', role: 'ADMIN', menu: 'tongquan', type: 'list' },
    { file: '005_Logout_XacNhan.png', caption: 'Xác nhận đăng xuất', role: 'ADMIN', menu: 'tongquan', type: 'dialog_confirm' },

    // Users (1.15 - 1.20)
    { file: '006_User_List.png', caption: 'Danh sách tài khoản', role: 'ADMIN', menu: 'taikhoan', type: 'list' },
    { file: '007_User_Search.png', caption: 'Tìm kiếm tài khoản', role: 'ADMIN', menu: 'taikhoan', type: 'list_search_found' },
    { file: '008_User_SearchEmpty.png', caption: 'Không tìm thấy tài khoản', role: 'ADMIN', menu: 'taikhoan', type: 'list_search_empty' },
    { file: '009_User_Edit.png', caption: 'Sửa tài khoản', role: 'ADMIN', menu: 'taikhoan', type: 'form' },
    { file: '010_User_Error.png', caption: 'Lỗi hệ thống khi cập nhật', role: 'ADMIN', menu: 'taikhoan', type: 'dialog_error' },
    { file: '011_User_Delete.png', caption: 'Xác nhận xóa tài khoản', role: 'ADMIN', menu: 'taikhoan', type: 'dialog_confirm' },

    // Rosters (1.21 - 1.24)
    { file: '012_Roster_List.png', caption: 'Nhập danh sách sinh viên', role: 'STAFF', menu: 'sinhvien', type: 'list' },
    { file: '013_Roster_Upload.png', caption: 'Upload file danh sách sinh viên', role: 'STAFF', menu: 'sinhvien', type: 'form_upload' },
    { file: '014_Roster_FormatError.png', caption: 'Lỗi định dạng file danh sách', role: 'STAFF', menu: 'sinhvien', type: 'dialog_error' },
    { file: '015_Roster_DupError.png', caption: 'Lỗi danh sách sinh viên trùng lặp', role: 'STAFF', menu: 'sinhvien', type: 'dialog_error' },

    // Notifications & Chat (1.25 - 1.28)
    { file: '016_Notif_View.png', caption: 'Xem thông báo', role: 'STAFF', menu: 'thongbao', type: 'list' },
    { file: '017_Chat_Staff.png', caption: 'Chat nội bộ (giáo vụ khoa)', role: 'STAFF', menu: 'chat', type: 'chat' },
    { file: '018_Chat_Lecturer.png', caption: 'Chat nội bộ (giảng viên)', role: 'LECTURER', menu: 'chat', type: 'chat' },
    { file: '019_Chat_Student.png', caption: 'Chat nội bộ (sinh viên)', role: 'STUDENT', menu: 'chat', type: 'chat' },

    // Dashboard (1.29)
    { file: '020_Dashboard_Staff.png', caption: 'Trang tổng quan', role: 'STAFF', menu: 'tongquan', type: 'dashboard' },

    // Periods (1.30 - 1.34)
    { file: '021_Period_List.png', caption: 'Quản lý học phần đợt đồ án', role: 'STAFF', menu: 'hocphandoan', type: 'list' },
    { file: '022_Period_Add.png', caption: 'Thêm mới đợt đồ án', role: 'STAFF', menu: 'hocphandoan', type: 'form' },
    { file: '023_Period_Edit.png', caption: 'Sửa thông tin đợt đồ án', role: 'STAFF', menu: 'hocphandoan', type: 'form' },
    { file: '024_Period_EmptyError.png', caption: 'Lỗi bỏ trống thông tin đợt đồ án', role: 'STAFF', menu: 'hocphandoan', type: 'dialog_error' },
    { file: '025_Period_DupError.png', caption: 'Lỗi mã đợt đồ án trùng lặp', role: 'STAFF', menu: 'hocphandoan', type: 'dialog_error' },

    // Groups (1.35 - 1.37)
    { file: '026_Group_Create.png', caption: 'Tạo nhóm', role: 'STUDENT', menu: 'nhom', type: 'form' },
    { file: '027_Group_List.png', caption: 'Quản lý nhóm', role: 'STAFF', menu: 'nhom', type: 'list' },
    { file: '028_Group_Edit.png', caption: 'Sửa thông tin nhóm', role: 'STAFF', menu: 'nhom', type: 'form' },

    // Topics (1.38 - 1.46, skip 1.47-1.48)
    { file: '029_Topic_ListStaff.png', caption: 'Danh sách đề tài (giáo vụ khoa)', role: 'STAFF', menu: 'detai', type: 'list' },
    { file: '030_Topic_Search.png', caption: 'Tìm kiếm đề tài', role: 'STAFF', menu: 'detai', type: 'list_search_found' },
    { file: '031_Topic_ListLecturer.png', caption: 'Danh sách đề tài (giảng viên)', role: 'LECTURER', menu: 'detai', type: 'list' },
    { file: '032_Topic_ListStudent.png', caption: 'Danh sách đề tài (sinh viên)', role: 'STUDENT', menu: 'detai', type: 'list' },
    { file: '033_Topic_Detail.png', caption: 'Xem chi tiết đề tài', role: 'STUDENT', menu: 'detai', type: 'form' },
    { file: '034_Topic_Edit.png', caption: 'Chỉnh sửa đề tài', role: 'LECTURER', menu: 'detai', type: 'form' },
    { file: '035_Topic_EmptyError.png', caption: 'Lỗi bỏ trống thông tin đề tài', role: 'LECTURER', menu: 'detai', type: 'dialog_error' },
    { file: '036_Topic_ApprovedError.png', caption: 'Lỗi chỉnh sửa khi đề tài đã được phê duyệt', role: 'LECTURER', menu: 'detai', type: 'dialog_error' },
    { file: '037_Topic_Approve.png', caption: 'Duyệt đề tài', role: 'STAFF', menu: 'detai', type: 'dialog_confirm' },

    // Topic Changes (1.49 - 1.51)
    { file: '038_TopicChange_Staff.png', caption: 'Yêu cầu thay đổi đề tài (giáo vụ)', role: 'STAFF', menu: 'doidetai', type: 'list' },
    { file: '039_TopicChange_Student.png', caption: 'Yêu cầu thay đổi đề tài (sinh viên)', role: 'STUDENT', menu: 'doidetai', type: 'list' },
    { file: '040_TopicChange_Form.png', caption: 'Thay đổi đề tài', role: 'STUDENT', menu: 'doidetai', type: 'form' },

    // Assignments (1.52 - 1.53)
    { file: '041_Topic_Assign.png', caption: 'Phân công giảng viên hướng dẫn / phản biện', role: 'STAFF', menu: 'detai', type: 'form_assign' },
    { file: '042_Topic_AssignError.png', caption: 'Lỗi phân công trùng giảng viên', role: 'STAFF', menu: 'detai', type: 'dialog_error' },

    // Submissions (1.54 - 1.56)
    { file: '043_Sub_Setup.png', caption: 'Thiết lập mốc tiến độ', role: 'STAFF', menu: 'hocphandoan', type: 'form' },
    { file: '044_Sub_Submit.png', caption: 'Nộp báo cáo tiến độ', role: 'STUDENT', menu: 'nopbai', type: 'form_upload' },
    { file: '045_Sub_LateError.png', caption: 'Lỗi nộp báo cáo quá hạn', role: 'STUDENT', menu: 'nopbai', type: 'dialog_error' },

    // Extensions (1.57 - 1.61)
    { file: '046_Ext_LimitError.png', caption: 'Lỗi vượt quá số lần gia hạn cho phép', role: 'STUDENT', menu: 'giahan', type: 'dialog_error' },
    { file: '047_Ext_List.png', caption: 'Duyệt gia hạn nộp báo cáo', role: 'STAFF', menu: 'giahan', type: 'list' },
    { file: '048_Ext_Approve.png', caption: 'Phê duyệt gia hạn', role: 'STAFF', menu: 'giahan', type: 'dialog_confirm' },
    { file: '049_Ext_Reject.png', caption: 'Thông báo từ chối gia hạn', role: 'STAFF', menu: 'giahan', type: 'dialog_confirm' },
    { file: '050_Ext_Request.png', caption: 'Xin gia hạn', role: 'STUDENT', menu: 'giahan', type: 'form' },

    // Grading (1.62 - 1.63, skip 1.64-1.65)
    { file: '051_Grade_Form.png', caption: 'Đánh giá bản nộp tiến độ', role: 'LECTURER', menu: 'diemso', type: 'form' },
    { file: '052_Grade_NoSubError.png', caption: 'Lỗi đánh giá khi sinh viên chưa nộp', role: 'LECTURER', menu: 'diemso', type: 'dialog_error' },

    // Scores (1.66 - 1.73, skip 1.74-1.77)
    { file: '053_Score_Assign.png', caption: 'Phân công chấm điểm / hội đồng', role: 'STAFF', menu: 'diemso', type: 'list' },
    { file: '054_Score_Form.png', caption: 'Phiếu chấm điểm', role: 'LECTURER', menu: 'diemso', type: 'form_score' },
    { file: '055_Score_MaxError.png', caption: 'Lỗi nhập điểm vượt mức quy định', role: 'LECTURER', menu: 'diemso', type: 'dialog_error' },
    { file: '056_Score_LockError.png', caption: 'Lỗi chưa khóa phiếu điểm', role: 'LECTURER', menu: 'diemso', type: 'dialog_error' },
    { file: '057_Score_Total.png', caption: 'Tổng hợp kết quả điểm', role: 'STAFF', menu: 'diemso', type: 'list' },
    { file: '058_Score_Result.png', caption: 'Kết quả điểm số', role: 'STUDENT', menu: 'diemso', type: 'list' },
    { file: '059_Score_WarnDiff.png', caption: 'Cảnh báo chênh lệch điểm', role: 'STAFF', menu: 'diemso', type: 'dialog_error' },
    { file: '060_Score_NotEnoughError.png', caption: 'Lỗi chưa đủ phiếu chấm', role: 'STAFF', menu: 'diemso', type: 'dialog_error' },
];

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    let count = 0;

    for (const item of TARGET_IMAGES) {
        let roleLabel = 'Quản trị viên';
        let avatarColor = '#e74c3c';
        if (item.role === 'STAFF') { roleLabel = 'Giáo vụ'; avatarColor = '#9b59b6'; }
        else if (item.role === 'LECTURER') { roleLabel = 'Giảng viên'; avatarColor = '#3498db'; }
        else if (item.role === 'STUDENT') { roleLabel = 'Sinh viên'; avatarColor = '#2ecc71'; }

        // Sidebar HTML
        const menusForRole = NAV_ITEMS.filter(m => m.roles.includes(item.role));
        let sidebarHtml = '';
        menusForRole.forEach(m => {
            const isActive = m.id === item.menu;
            sidebarHtml += `
                <div style="padding: 12px 20px; font-size: 16px; ${isActive ? 'background-color: #feeebf; font-weight: bold; border-left: 4px solid #f39c12;' : ''}">
                    ❖ ${m.label} ${isActive ? ' ◀' : ''}
                </div>
            `;
        });

        let contentHtml = '';

        if (item.type === 'login') {
            contentHtml = `
                <div style="display:flex; height: 100%; align-items:center; justify-content:center;">
                    <div style="width: 400px; padding: 30px; border: 3px solid #333; border-radius: 15px 225px 15px 255px/255px 15px 225px 15px; box-shadow: 8px 8px 0 rgba(0,0,0,0.2); background: #fff;">
                        <h2 style="text-align:center; font-weight:bold; margin-top:0;">ĐĂNG NHẬP</h2>
                        <div style="margin-top: 20px;">
                            <label>Email:</label>
                            <input type="text" value="" placeholder="Nhập email @st.phenikaa-uni.edu.vn" style="width:100%; padding:8px; border:2px solid #555; border-radius:15px; margin-top:5px; margin-bottom:15px; font-family:'Comic Sans MS'">
                            
                            <label>Mật khẩu:</label>
                            <input type="password" value="" placeholder="Nhập mật khẩu" style="width:100%; padding:8px; border:2px solid #555; border-radius:15px; margin-top:5px; margin-bottom:20px; font-family:'Comic Sans MS'">
                            
                            <button style="width:100%; padding:10px; background:#3498db; color:white; font-weight:bold; border:2px solid #333; border-radius:15px;">Đăng nhập</button>
                        </div>
                    </div>
                </div>
            `;
        } else if (item.type.startsWith('list') || item.type === 'dashboard') {
            // Dynamic List Headers based on menu
            let headers = '';
            let rows = '';
            let searchInput = item.type === 'list_search_found' ? 'Từ khóa' : (item.type === 'list_search_empty' ? 'Dữ liệu không tồn tại' : '');
            let isSearch = item.type !== 'list' && item.type !== 'dashboard';
            let hasResults = item.type !== 'list_search_empty';

            if (item.menu === 'taikhoan') {
                headers = '<th>Email</th><th>Họ tên</th><th>Vai trò</th><th>Trạng thái</th>';
                rows = `
                    <tr><td>admin@phenikaa.vn</td><td>Nguyễn Quản Trị</td><td>Quản trị viên</td><td>Hoạt động</td></tr>
                    <tr><td>gv_hoa@phenikaa.vn</td><td>Lê Thị Hoa</td><td>Giảng viên</td><td>Hoạt động</td></tr>
                    <tr><td>20010001@st.phenikaa-uni.edu.vn</td><td>Trần Văn Sinh</td><td>Sinh viên</td><td>Hoạt động</td></tr>
                `;
            } else if (item.menu === 'hocphandoan') {
                headers = '<th>Mã đợt</th><th>Tên đợt</th><th>Học kỳ</th><th>Năm học</th><th>Trạng thái</th>';
                rows = `
                    <tr><td>K14_HK1_24</td><td>Đồ án cơ sở K14</td><td>1</td><td>2024-2025</td><td>Đang diễn ra</td></tr>
                    <tr><td>K13_HK2_23</td><td>Đồ án chuyên ngành K13</td><td>2</td><td>2023-2024</td><td>Đã kết thúc</td></tr>
                `;
            } else if (item.menu === 'sinhvien') {
                headers = '<th>Mã SV</th><th>Họ tên</th><th>Email</th><th>Lớp</th>';
                rows = `
                    <tr><td>20010111</td><td>Lý Công Uẩn</td><td>20010111@st.phenikaa-uni.edu.vn</td><td>K14-CNTT1</td></tr>
                    <tr><td>20010222</td><td>Trần Quốc Toản</td><td>20010222@st.phenikaa-uni.edu.vn</td><td>K14-CNTT2</td></tr>
                `;
            } else if (item.menu === 'detai') {
                headers = '<th>Tên đề tài</th><th>Lĩnh vực</th><th>Giảng viên</th><th>Trạng thái</th>';
                rows = `
                    <tr><td>Nghiên cứu AI y tế</td><td>Trí tuệ nhân tạo</td><td>TS. Nguyễn Văn A</td><td>Đã duyệt</td></tr>
                    <tr><td>Web quản lý thư viện</td><td>Công nghệ phần mềm</td><td>ThS. Trần Thị B</td><td>Chờ duyệt</td></tr>
                `;
            } else if (item.menu === 'nhom') {
                headers = '<th>Tên nhóm</th><th>Đề tài</th><th>Thành viên</th><th>Trạng thái</th>';
                rows = `
                    <tr><td>Nhóm 01 - AI</td><td>Nghiên cứu AI y tế</td><td>3/3</td><td>Đã chốt</td></tr>
                    <tr><td>Nhóm 02 - Web</td><td>Web quản lý thư viện</td><td>2/3</td><td>Đang tuyển</td></tr>
                `;
            } else {
                headers = '<th>Mã</th><th>Tên</th><th>Trạng thái</th>';
                rows = `<tr><td>01</td><td>Dữ liệu 1</td><td>Hoàn thành</td></tr>`;
            }

            if (!hasResults) {
                rows = `<tr><td colspan="5" style="padding:30px;text-align:center;color:#777;">Không tìm thấy dữ liệu nào phù hợp với "${searchInput}"</td></tr>`;
            }

            contentHtml = `
                <!-- Toolbar -->
                <div style="display:flex; justify-content:space-between; margin-bottom:15px; border-bottom:2px solid #ccc; padding-bottom:10px;">
                    <div style="display:flex; gap:10px;">
                        <button style="padding:8px; background:#2ecc71; color:white; border:2px solid #333; border-radius:10px; font-family:'Comic Sans MS'">+ Thêm</button>
                        <button style="padding:8px; background:#f1c40f; color:white; border:2px solid #333; border-radius:10px; font-family:'Comic Sans MS'">✎ Sửa</button>
                        <button style="padding:8px; background:#e74c3c; color:white; border:2px solid #333; border-radius:10px; font-family:'Comic Sans MS'">🗑 Xóa</button>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <input type="text" value="${searchInput}" placeholder="Tìm kiếm..." style="padding:8px; border:2px solid #333; border-radius:10px; font-family:'Comic Sans MS'; ${isSearch ? 'background:#fff2a8;' : ''}">
                        <button style="padding:8px; background:${isSearch ? '#27ae60' : '#2ecc71'}; color:white; border:2px solid #333; border-radius:10px; font-family:'Comic Sans MS'">🔍</button>
                    </div>
                </div>
                <!-- Table -->
                <style>
                    table th { background:#ecf0f1; padding:10px; border:2px solid #ccc; }
                    table td { padding:10px; border:1px solid #ccc; background:#fff; }
                </style>
                <table style="width:100%; border-collapse:collapse; border:2px solid #333; text-align:left;">
                    <thead><tr>${headers}</tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            `;
        } else if (item.type === 'form') {
            // Dynamic Form based on menu
            let formFields = '';
            if (item.menu === 'taikhoan') {
                formFields = `
                    <label>Email:</label><br><input type="text" value="gv_hoa@phenikaa.vn"><br><br>
                    <label>Họ tên:</label><br><input type="text" value="Lê Thị Hoa"><br><br>
                    <label>Vai trò:</label><br>
                    <select><option>Giảng viên</option><option>Giáo vụ</option><option>Quản trị viên</option></select>
                `;
            } else if (item.menu === 'hocphandoan') {
                formFields = `
                    <div style="display:flex; gap:20px;">
                        <div style="flex:1"><label>Mã đợt:</label><br><input type="text" value="K14_HK1_24"></div>
                        <div style="flex:1"><label>Tên đợt:</label><br><input type="text" value="Đồ án cơ sở K14"></div>
                    </div><br>
                    <div style="display:flex; gap:20px;">
                        <div style="flex:1"><label>Học kỳ:</label><br><select><option>1</option><option>2</option></select></div>
                        <div style="flex:1"><label>Năm học:</label><br><input type="text" value="2024-2025"></div>
                    </div><br>
                    <label>Hạn nộp báo cáo:</label><br><input type="date" value="2024-12-30">
                `;
            } else if (item.menu === 'detai') {
                formFields = `
                    <label>Tên đề tài:</label><br><input type="text" value="Nghiên cứu ứng dụng AI trong Y tế"><br><br>
                    <div style="display:flex; gap:20px;">
                        <div style="flex:1"><label>Lĩnh vực:</label><br><select><option>Trí tuệ nhân tạo</option></select></div>
                        <div style="flex:1"><label>Số lượng SV tối đa:</label><br><input type="number" value="3"></div>
                    </div><br>
                    <label>Kỹ năng yêu cầu:</label><br><input type="text" value="Python, Machine Learning, Data Science"><br><br>
                    <label>Mô tả chi tiết:</label><br><textarea style="height:80px;">Nghiên cứu các mô hình AI dự đoán bệnh lý từ ảnh X-Quang.</textarea>
                `;
            } else if (item.menu === 'nhom') {
                formFields = `
                    <label>Tên nhóm:</label><br><input type="text" value="Nhóm 01 - AI K14"><br><br>
                    <label>Chọn đề tài:</label><br><select><option>Nghiên cứu ứng dụng AI trong Y tế</option></select><br><br>
                    <label>Danh sách thành viên (Nhập mã SV):</label><br>
                    <textarea style="height:60px;">20010111\n20010222</textarea>
                `;
            } else if (item.menu === 'giahan') {
                formFields = `
                    <label>Lý do xin gia hạn:</label><br><textarea style="height:60px;">Nhóm em gặp sự cố về dữ liệu nên xin gia hạn thêm 3 ngày ạ.</textarea><br><br>
                    <label>Số ngày gia hạn mong muốn:</label><br><input type="number" value="3">
                `;
            } else if (item.menu === 'diemso') {
                formFields = `
                    <label>Nhận xét chung:</label><br><textarea style="height:80px;">Nhóm làm việc chăm chỉ, báo cáo trình bày rõ ràng, tuy nhiên phần kết luận còn sơ sài.</textarea><br><br>
                    <label>Trạng thái đánh giá:</label><br><select><option>Đạt yêu cầu</option><option>Cần chỉnh sửa</option></select>
                `;
            } else {
                formFields = `<label>Trường dữ liệu:</label><br><input type="text" value="Dữ liệu mẫu">`;
            }

            contentHtml = `
                <div style="border-bottom:2px solid #ccc; padding-bottom:10px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0;">${item.caption}</h3>
                    <button style="padding:8px 15px; background:#3498db; color:white; border:2px solid #333; border-radius:10px; font-family:'Comic Sans MS'">💾 Lưu lại</button>
                </div>
                <style>
                    input, select, textarea { width:100%; padding:8px; border:2px solid #555; border-radius:8px; font-family:'Comic Sans MS'; box-sizing:border-box; }
                    label { font-weight:bold; font-size:14px; }
                </style>
                <div style="background:#f9f9f9; padding:20px; border:2px solid #ccc; border-radius:10px;">
                    ${formFields}
                </div>
            `;
        } else if (item.type === 'form_upload') {
            contentHtml = `
                <h3 style="margin-top:0;">${item.caption}</h3>
                <div style="border:4px dashed #3498db; padding:50px; text-align:center; background:#f0f8ff; border-radius:15px; margin-top:20px;">
                    <div style="font-size:40px; margin-bottom:15px;">☁️</div>
                    <div style="font-size:18px; font-weight:bold; margin-bottom:10px;">Kéo thả file vào đây hoặc nhấn để chọn file</div>
                    <div style="color:#666; font-size:14px;">Hỗ trợ định dạng: .xlsx, .csv, .pdf (Tối đa 5MB)</div>
                    <button style="margin-top:20px; padding:10px 20px; background:#3498db; color:white; font-weight:bold; border:2px solid #333; border-radius:15px; font-family:'Comic Sans MS'">📄 Chọn File</button>
                </div>
            `;
        } else if (item.type === 'form_score') {
            contentHtml = `
                <h3 style="margin-top:0;">Phiếu chấm điểm (Sinh viên: Lý Công Uẩn)</h3>
                <table style="width:100%; border-collapse:collapse; border:2px solid #333; text-align:left; background:#fff;">
                    <tr style="background:#ecf0f1;">
                        <th style="padding:10px; border:1px solid #ccc;">Tiêu chí đánh giá</th>
                        <th style="padding:10px; border:1px solid #ccc;">Điểm tối đa</th>
                        <th style="padding:10px; border:1px solid #ccc;">Điểm đạt được</th>
                    </tr>
                    <tr>
                        <td style="padding:10px; border:1px solid #ccc;">Hình thức báo cáo</td>
                        <td style="padding:10px; border:1px solid #ccc; text-align:center;">2.0</td>
                        <td style="padding:10px; border:1px solid #ccc;"><input type="number" value="1.8" style="width:80px; padding:5px; border:2px solid #555; border-radius:5px; font-family:'Comic Sans MS'"></td>
                    </tr>
                    <tr>
                        <td style="padding:10px; border:1px solid #ccc;">Nội dung thực hiện</td>
                        <td style="padding:10px; border:1px solid #ccc; text-align:center;">5.0</td>
                        <td style="padding:10px; border:1px solid #ccc;"><input type="number" value="4.5" style="width:80px; padding:5px; border:2px solid #555; border-radius:5px; font-family:'Comic Sans MS'"></td>
                    </tr>
                    <tr>
                        <td style="padding:10px; border:1px solid #ccc;">Kỹ năng trình bày</td>
                        <td style="padding:10px; border:1px solid #ccc; text-align:center;">3.0</td>
                        <td style="padding:10px; border:1px solid #ccc;"><input type="number" value="2.5" style="width:80px; padding:5px; border:2px solid #555; border-radius:5px; font-family:'Comic Sans MS'"></td>
                    </tr>
                </table>
                <div style="margin-top:20px; text-align:right;">
                    <span style="font-size:18px; font-weight:bold; margin-right:20px;">Tổng điểm: <span style="color:#e74c3c">8.8 / 10</span></span>
                    <button style="padding:10px 20px; background:#2ecc71; color:white; font-weight:bold; border:2px solid #333; border-radius:15px; font-family:'Comic Sans MS'">🔒 Khóa phiếu điểm</button>
                </div>
            `;
        } else if (item.type === 'form_assign') {
            contentHtml = `
                <h3 style="margin-top:0;">Phân công Giảng viên Hướng dẫn / Phản biện</h3>
                <div style="background:#f9f9f9; padding:20px; border:2px solid #ccc; border-radius:10px;">
                    <label style="font-weight:bold;">Đề tài đang chọn:</label>
                    <div style="padding:10px; background:#e0f7fa; border:1px solid #b2ebf2; border-radius:8px; margin-top:5px; margin-bottom:15px;">Nghiên cứu ứng dụng AI trong Y tế (Nhóm 01 - AI K14)</div>
                    
                    <label style="font-weight:bold;">Giảng viên Hướng dẫn:</label><br>
                    <select style="width:100%; padding:8px; border:2px solid #555; border-radius:8px; margin-top:5px; margin-bottom:15px; font-family:'Comic Sans MS'"><option>TS. Nguyễn Văn A</option></select>
                    
                    <label style="font-weight:bold;">Giảng viên Phản biện:</label><br>
                    <select style="width:100%; padding:8px; border:2px solid #555; border-radius:8px; margin-top:5px; margin-bottom:15px; font-family:'Comic Sans MS'"><option>ThS. Trần Thị B</option></select>
                    
                    <button style="padding:10px 20px; background:#3498db; color:white; font-weight:bold; border:2px solid #333; border-radius:10px; font-family:'Comic Sans MS'">💾 Phân công</button>
                </div>
            `;
        } else if (item.type === 'chat') {
            contentHtml = `
                <div style="display:flex; height:100%; border:2px solid #333; border-radius:10px; overflow:hidden;">
                    <div style="width:250px; border-right:2px solid #333; background:#f9f9f9;">
                        <div style="padding:15px; border-bottom:1px solid #ccc; font-weight:bold;">Đoạn chat gần đây</div>
                        <div style="padding:15px; background:#e0f7fa; border-bottom:1px solid #ccc; display:flex; align-items:center; gap:10px;">
                            <div style="width:30px; height:30px; border-radius:50%; background:#2ecc71;"></div>
                            <div>
                                <div style="font-weight:bold; font-size:14px;">Thầy Hải</div>
                                <div style="font-size:12px; color:#555;">Các em nhớ nộp báo cáo...</div>
                            </div>
                        </div>
                    </div>
                    <div style="flex:1; display:flex; flex-direction:column; background:#fff;">
                        <div style="padding:15px; border-bottom:1px solid #ccc; font-weight:bold; font-size:18px;">Chat: Thầy Hải</div>
                        <div style="flex:1; padding:20px; display:flex; flex-direction:column; gap:15px;">
                            <div style="align-self:flex-start; max-width:70%; background:#ecf0f1; padding:10px 15px; border-radius:15px; border:1px solid #ccc;">
                                Thầy ơi nhóm em nộp báo cáo tuần này muộn 1 hôm được không ạ?
                            </div>
                            <div style="align-self:flex-end; max-width:70%; background:#3498db; color:white; padding:10px 15px; border-radius:15px; border:1px solid #2980b9;">
                                Không được đâu em, deadline là deadline.
                            </div>
                        </div>
                        <div style="padding:15px; border-top:1px solid #ccc; display:flex; gap:10px;">
                            <input type="text" placeholder="Nhập tin nhắn..." style="flex:1; padding:10px; border:2px solid #ccc; border-radius:20px; font-family:'Comic Sans MS'">
                            <button style="padding:10px 20px; background:#3498db; color:white; font-weight:bold; border:2px solid #2980b9; border-radius:20px; font-family:'Comic Sans MS'">Gửi</button>
                        </div>
                    </div>
                </div>
            `;
        }

        // Overlay for dialogs
        if (item.type.startsWith('dialog_')) {
            const isConfirm = item.type === 'dialog_confirm';
            const icon = isConfirm ? '⚠️' : '❌';
            const header = isConfirm ? 'Xác nhận' : 'Lỗi hệ thống';
            
            let btns = `<button style="padding:10px 25px;border:2px solid #333;background:#333;color:white;font-weight:bold;margin-top:20px;border-radius:15px;font-family:'Comic Sans MS'">${isConfirm ? 'Xác nhận' : 'Đóng'}</button>`;
            if (isConfirm) {
                btns = `<button style="padding:10px 25px;border:2px solid #333;background:#fff;margin-right:15px;color:#333;font-weight:bold;border-radius:15px;font-family:'Comic Sans MS'">Hủy bỏ</button>` + btns;
            }

            // We generate a blurred background list view
            contentHtml = `
                <div style="filter: blur(3px);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:15px; border-bottom:2px solid #ccc; padding-bottom:10px;">
                        <button style="padding:8px; background:#2ecc71; color:white; border:2px solid #333; border-radius:10px;">+ Thêm</button>
                        <input type="text" placeholder="Tìm kiếm..." style="padding:8px; border:2px solid #333; border-radius:10px;">
                    </div>
                    <table style="width:100%; border-collapse:collapse; border:2px solid #333;">
                        <tr style="background:#ecf0f1;"><th style="padding:10px;">Mã</th><th style="padding:10px;">Dữ liệu</th></tr>
                        <tr><td style="padding:10px;border:1px solid #ccc">01</td><td style="padding:10px;border:1px solid #ccc">Mẫu 1</td></tr>
                    </table>
                </div>

                <!-- OVERLAY -->
                <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:9999;">
                    <div style="background:#fff; padding:30px; border:4px solid #333; width:450px; text-align:center; border-radius:20px; box-shadow:10px 10px 0 rgba(0,0,0,0.8);">
                        <h3 style="margin-top:0;font-size:24px;font-weight:bold;color:${isConfirm ? '#e67e22' : '#e74c3c'}">${icon} ${header}</h3>
                        <p style="font-size:18px; margin:20px 0;">${item.caption}</p>
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
                    .browser-actions { display:flex; gap: 5px; font-weight: bold; font-size: 18px; }
                    .browser-url {
                        flex: 1; border: 2px solid #555; height: 24px; border-radius: 12px;
                        padding: 0 10px; font-size: 12px; display:flex; align-items:center;
                    }
                    .layout { display: flex; flex: 1; }
                    .sidebar { width: 250px; border-right: 3px solid #333; display: flex; flex-direction: column; }
                    .sidebar-profile { padding: 20px; border-bottom: 3px solid #333; display: flex; align-items: center; gap: 15px; }
                    .sidebar-avatar {
                        width: 50px; height: 50px; border-radius: 50%;
                        background: ${avatarColor}; color: white;
                        display: flex; align-items: center; justify-content: center;
                        font-size: 24px; font-weight: bold; border: 2px solid #333;
                    }
                    .sidebar-user h3 { margin: 0; font-size: 16px; }
                    .sidebar-user p { margin: 0; font-size: 12px; color: #555; }
                    .sidebar-nav { flex: 1; padding-top: 10px; }
                    .sidebar-bottom { padding: 15px 20px; border-top: 3px solid #333; font-weight: bold; font-size: 16px; display: flex; align-items: center; gap: 10px; }
                    .main-wrapper { flex: 1; display: flex; flex-direction: column; background: #fff; }
                    .main-header { padding: 15px 20px; border-bottom: 3px solid #333; font-weight: bold; font-size: 18px; background: #fdfdfd; }
                    .main-content {
                        flex: 1; padding: 20px; overflow: hidden; margin: 15px;
                        border: 4px solid #8ab4f8; border-radius: 5px; position: relative;
                    }
                </style>
            </head>
            <body>
                <div class="browser">
                    <div style="text-align:center; font-size:12px; padding: 2px 0; border-bottom:1px solid #333;">A Web Page</div>
                    <div class="browser-header">
                        <div class="browser-actions">⬅ ➡ ✖ 🏠</div>
                        <div class="browser-url">http://localhost:3000/dashboard/${item.menu}</div>
                    </div>
                    <div class="layout">
                        ${item.type === 'login' ? '' : `
                        <div class="sidebar">
                            <div class="sidebar-profile">
                                <div class="sidebar-avatar">${item.role.charAt(0)}</div>
                                <div class="sidebar-user">
                                    <h3>User Name</h3>
                                    <p>${roleLabel}</p>
                                </div>
                            </div>
                            <div class="sidebar-nav">
                                ${sidebarHtml}
                            </div>
                            <div class="sidebar-bottom">🚪 Đăng xuất</div>
                        </div>
                        `}
                        <div class="main-wrapper">
                            ${item.type === 'login' ? '' : `
                            <div class="main-header">Quản lý Đồ án - ${item.caption}</div>
                            `}
                            <div class="main-content" ${item.type === 'login' ? 'style="border-color:transparent"' : ''}>
                                ${contentHtml}
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        await page.setContent(fullHtml);
        await page.waitForTimeout(100);
        
        const outPath = path.join(OUTPUT_DIR, item.file);
        const browserElement = await page.$('.browser');
        if (browserElement) {
            await browserElement.screenshot({ path: outPath });
        } else {
            await page.screenshot({ path: outPath });
        }

        count++;
        console.log(`Captured [${count}/${TARGET_IMAGES.length}]: ${item.file}`);
    }

    await browser.close();
    console.log("Done generating Refined Hand-Drawn Mockups!");
})();
