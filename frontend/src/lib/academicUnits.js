export const ACADEMIC_UNITS = [
  { value: 'computer_science', label: 'Khoa Khoa học máy tính' },
  { value: 'information_systems', label: 'Khoa Hệ thống thông tin' },
  { value: 'ai_data_science', label: 'Khoa Trí tuệ nhân tạo và Khoa học dữ liệu' },
];

export const TOPIC_DOMAINS = [
  { value: 'software_development', label: 'Phát triển phần mềm' },
  { value: 'information_systems', label: 'Hệ thống thông tin' },
  { value: 'computer_science', label: 'Khoa học máy tính' },
  { value: 'artificial_intelligence', label: 'Trí tuệ nhân tạo' },
  { value: 'data_science', label: 'Khoa học dữ liệu' },
  { value: 'cybersecurity', label: 'An toàn thông tin' },
  { value: 'web_mobile', label: 'Web/App' },
  { value: 'iot', label: 'IoT' },
  { value: 'cloud_devops', label: 'Cloud/DevOps' },
  { value: 'other', label: 'Khác' },
];

export function getAcademicUnitLabel(value) {
  return ACADEMIC_UNITS.find((item) => item.value === value)?.label || value || 'Chưa chọn khoa';
}

export function getTopicDomainLabel(value) {
  return TOPIC_DOMAINS.find((item) => item.value === value)?.label || value || 'Chưa chọn hướng';
}
