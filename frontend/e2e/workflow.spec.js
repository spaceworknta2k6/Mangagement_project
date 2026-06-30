const { test, expect } = require('@playwright/test');
const { execSync } = require('child_process');

test.beforeAll(() => {
  execSync('node clean-e2e.js', { cwd: '..' });
});

async function loginAsStaff(page) {
  await page.goto('/auth/login');
  await page.fill('input[name="email"]', 'huonglt@hust.edu.vn');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
  await expect(page.getByText('Lê Thị Hương')).toBeVisible();
}

test('staff dashboard navigation matches updated grading workflow', async ({ page }) => {
  await loginAsStaff(page);

  await expect(page.getByRole('button', { name: /Học phần/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Tiêu chí đánh giá/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Điểm số/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Phúc khảo/ })).toBeVisible();

  await expect(page.getByText(/Hội đồng/i)).toHaveCount(0);
  await expect(page.getByText(/Bảo vệ/i)).toHaveCount(0);

  await page.goto('/dashboard/periods');
  await expect(page.getByRole('heading', { name: /Quản lý đợt học phần/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Tạo đợt học phần/ })).toBeVisible();

  await page.goto('/dashboard/projects');
  await expect(page.getByRole('heading', { name: /Quản lý Dự án/i })).toBeVisible();
  await expect(page.getByText(/Sẵn sàng chấm|Đang thực hiện|Mới phân công|Đã hoàn thành/)).toBeVisible();

  await page.goto('/dashboard/rubrics');
  await expect(page.getByRole('heading', { name: /Quản lý Tiêu chí Đánh giá/ })).toBeVisible();
  await expect(page.getByText(/GVHD|GV Chấm 2/).first()).toBeVisible();
  await expect(page.getByText(/Hội đồng/i)).toHaveCount(0);

  await page.goto('/dashboard/scores');
  await expect(page.getByRole('heading', { name: /Điểm số|Chấm điểm/ })).toBeVisible();

  await page.goto('/dashboard/appeals');
  await expect(page.getByRole('heading', { name: /Phúc Khảo/i })).toBeVisible();
});
