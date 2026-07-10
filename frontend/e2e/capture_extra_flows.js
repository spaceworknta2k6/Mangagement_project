const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = 'c:\\\\Users\\\\Admin\\\\Desktop\\\\rp\\\\screenshots_real_ui';
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

(async () => {
    console.log("Launching Playwright for Extra Flows...");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    async function loginAs(email, password = '123456') {
        await context.clearCookies();
        await page.goto('http://localhost:3000/auth/login');
        await page.waitForLoadState('networkidle');
        try {
            await page.fill('input[name="email"]', email);
            await page.fill('input[name="password"]', password);
            await page.click('button[type="submit"]');
            await page.waitForURL('**/dashboard**', { timeout: 10000 });
        } catch (e) {
            console.log("Login failed or already logged in.");
        }
    }

    // ==========================================
    // 1. EXTRA FLOWS: STUDENT GROUP (Add Member)
    // ==========================================
    console.log("-> 1. Luồng Thêm Thành Viên (Student)");
    await loginAs('sinhvien1@demo.com');

    // MOCK GET /groups to force a "draft" group where sv1 is leader
    await page.route('**/api/v1/groups*', async route => {
        if (route.request().method() === 'GET') {
            const sv1Id = "sv1_mock_id"; // Actually the frontend matches by user?.studentId
            // The frontend checks: myGroup.status === 'draft' && myGroup.leaderStudentId?._id === user?.studentId
            // To make it easy, we will evaluate user state later, but let's just let it load normally first.
            route.continue();
        } else {
            route.continue();
        }
    });

    // We can just use page.evaluate to force the UI state by altering the React state or DOM
    // BUT wait, it's easier to just mock the user's group status in DB via seed, OR intercept GET /groups.
    // Let's intercept GET /periods to get the period, then intercept GET /groups.
    
    // Instead of complex API mocking, let's just use page.evaluate to inject a "Mời thành viên" UI if it's missing, 
    // OR just use evaluate to set myGroup in the React component? We can't easily access React state.
    // Let's try to mock the GET /groups response exactly.
    await page.unroute('**/api/v1/groups*');
    await page.route('**/api/v1/groups*', async (route) => {
        if (route.request().method() === 'GET') {
            // Get original response
            const response = await route.fetch();
            let json = await response.json();
            
            // Force all groups to be "draft" and the leader to be the current user
            if (json.data && Array.isArray(json.data)) {
                json.data = json.data.map(g => {
                    g.status = 'draft'; // Force draft
                    return g;
                });
            } else if (json && Array.isArray(json)) {
                json = json.map(g => {
                    g.status = 'draft';
                    return g;
                });
            }
            await route.fulfill({ response, json });
        } else {
            route.continue();
        }
    });

    await page.goto('http://localhost:3000/dashboard/groups');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const inviteBtn = page.getByRole('button', { name: /Gửi lời mời/i });
    if (await inviteBtn.isVisible()) {
        console.log("Found Invite Button!");
        
        // 1A. Empty Validation Error
        await inviteBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(OUTPUT_DIR, '027a_Student_Group_AddMember_EmptyError.png') });
        console.log("Captured: 027a_Student_Group_AddMember_EmptyError.png");

        // Clear toasts so they don't stack
        await page.evaluate(() => { document.querySelectorAll('[role="status"], [aria-live="polite"]').forEach(e => e.remove()); });

        // 1B. Already in group Error
        await page.route('**/api/v1/groups/*/invite', async route => {
            const json = { success: false, message: "Sinh viên 20230005 đã là thành viên của một nhóm khác trong đợt này!" };
            await route.fulfill({ status: 400, contentType: 'application/json', json });
        });
        await page.fill('input[name="inviteStudentCode"]', '20230005');
        await inviteBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(OUTPUT_DIR, '027b_Student_Group_AddMember_AlreadyInGroupError.png') });
        console.log("Captured: 027b_Student_Group_AddMember_AlreadyInGroupError.png");

        // Clear toasts so they don't stack
        await page.evaluate(() => { document.querySelectorAll('[role="status"], [aria-live="polite"]').forEach(e => e.remove()); });

        // 1C. Success Toast
        await page.unroute('**/api/v1/groups/*/invite');
        await page.route('**/api/v1/groups/*/invite', async route => {
            const json = { success: true, message: "Đã gửi lời mời tham gia nhóm!" };
            await route.fulfill({ status: 200, contentType: 'application/json', json });
        });
        await page.fill('input[name="inviteStudentCode"]', '20230015');
        await inviteBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(OUTPUT_DIR, '027c_Student_Group_AddMember_Success.png') });
        console.log("Captured: 027c_Student_Group_AddMember_Success.png");
        
        await page.unroute('**/api/v1/groups*');
    } else {
        console.log("Invite button not visible even with mocked draft status.");
    }


    // ==========================================
    // 2. EXTRA FLOWS: STUDENT TOPIC (Propose)
    // ==========================================
    console.log("-> 2. Luồng Đề Xuất Đề Tài (Student)");
    await page.goto('http://localhost:3000/dashboard/topics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const proposeBtn = page.getByRole('button', { name: /Đề xuất đề tài mới/i });
    if (await proposeBtn.isVisible()) {
        await proposeBtn.click();
        await page.waitForTimeout(1000);
        
        // 2A. Propose Modal View
        await page.screenshot({ path: path.join(OUTPUT_DIR, '15a_Student_Topic_ProposeModal.png') });
        console.log("Captured: 15a_Student_Topic_ProposeModal.png");

        // 2B. Validation Error (Missing fields)
        const submitProposeBtn = page.locator('button[type="submit"]').last();
        await submitProposeBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(OUTPUT_DIR, '15b_Student_Topic_Propose_Error.png') });
        console.log("Captured: 15b_Student_Topic_Propose_Error.png");

        // Clear toasts so they don't stack
        await page.evaluate(() => { document.querySelectorAll('[role="status"], [aria-live="polite"]').forEach(e => e.remove()); });

        // 2C. Success
        await page.route('**/api/v1/topics', async route => {
            const json = { success: true, data: { _id: "mock_id" } };
            await route.fulfill({ status: 201, contentType: 'application/json', json });
        });
        await page.fill('input[name="title"]', 'Hệ thống Quản lý Bệnh viện Thông minh');
        await page.locator('textarea').first().fill('Xây dựng hệ thống quản lý bệnh nhân bằng AI.');
        await submitProposeBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(OUTPUT_DIR, '15c_Student_Topic_Propose_Success.png') });
        console.log("Captured: 15c_Student_Topic_Propose_Success.png");
        await page.unroute('**/api/v1/topics');
    } else {
        console.log("Propose Topic button not visible.");
    }


    // ==========================================
    // 3. EXTRA FLOWS: ADMIN USERS (Edit User)
    // ==========================================
    console.log("-> 3. Luồng Quản lý Tài khoản (Admin)");
    await loginAs('admin@demo.com', '123456');
    await page.goto('http://localhost:3000/dashboard/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const editBtns = page.locator('button[title="Chỉnh sửa vai trò và trạng thái"]');
    // Wait for at least one to be visible
    await editBtns.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    
    if (await editBtns.count() > 0) {
        // Click the last one (safest since it's probably not admin self)
        await editBtns.last().click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(OUTPUT_DIR, '03a_Admin_Users_EditModal.png') });
        console.log("Captured: 03a_Admin_Users_EditModal.png");

        // Success Edit
        await page.route('**/api/v1/users/*/role', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', json: { success: true } });
        });
        await page.route('**/api/v1/users/*/status', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', json: { success: true } });
        });
        
        await page.getByRole('button', { name: /Lưu thay đổi/i }).click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(OUTPUT_DIR, '03b_Admin_Users_Edit_Success.png') });
        console.log("Captured: 03b_Admin_Users_Edit_Success.png");
    } else {
        console.log("Edit User buttons not found.");
    }

    await browser.close();
    console.log("Done generating EXTRA UI screenshots!");
})();
